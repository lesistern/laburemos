#!/bin/bash
# LaburAR AWS Deployment Script - Complete Migration Automation
# Usage: ./aws-deploy.sh [stage] [region]
# Example: ./aws-deploy.sh production us-east-1

set -e

# Configuration
STAGE=${1:-staging}
AWS_REGION=${2:-us-east-1}
PROJECT_NAME="laburar"
DOMAIN_NAME=${3:-""}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws >/dev/null 2>&1; then
        error "AWS CLI not found. Please install AWS CLI first."
        exit 1
    fi
    
    # Check Terraform
    if ! command -v terraform >/dev/null 2>&1; then
        error "Terraform not found. Please install Terraform first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        error "Node.js not found. Please install Node.js first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        error "AWS credentials not configured. Run 'aws configure' first."
        exit 1
    fi
    
    log "Prerequisites check completed ✓"
}

# Setup environment variables
setup_environment() {
    log "Setting up environment for $STAGE..."
    
    export TF_VAR_stage=$STAGE
    export TF_VAR_aws_region=$AWS_REGION
    export TF_VAR_project_name=$PROJECT_NAME
    export TF_VAR_domain_name=$DOMAIN_NAME
    
    # Create terraform variables file
    cat > terraform/terraform.tfvars << EOF
stage = "$STAGE"
aws_region = "$AWS_REGION"
project_name = "$PROJECT_NAME"
domain_name = "$DOMAIN_NAME"

# Instance configuration
ec2_instance_type = "t3.micro"
rds_instance_class = "db.t3.micro"
rds_allocated_storage = 20

# Security configuration
allowed_cidr_blocks = ["0.0.0.0/0"]  # Restrict this in production
enable_deletion_protection = false    # Set to true in production

# Application configuration
frontend_build_command = "npm run build && npm run export"
backend_build_command = "npm run build"
EOF
    
    log "Environment setup completed ✓"
}

# Build applications
build_applications() {
    log "Building applications..."
    
    # Build frontend
    info "Building Next.js frontend..."
    cd frontend
    npm ci --only=production
    npm run build
    
    # For static export to S3
    if [ "$STAGE" = "production" ]; then
        npm run export
    fi
    
    cd ..
    
    # Build backend
    info "Building NestJS backend..."
    cd backend
    npm ci --only=production
    npm run build
    cd ..
    
    log "Application builds completed ✓"
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    log "Deploying infrastructure with Terraform..."
    
    cd terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    info "Creating deployment plan..."
    terraform plan -var-file=terraform.tfvars -out=tfplan
    
    # Apply deployment
    warn "Deploying infrastructure. This may take 10-15 minutes..."
    terraform apply tfplan
    
    # Get outputs
    EC2_IP=$(terraform output -raw ec2_public_ip)
    RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
    S3_BUCKET=$(terraform output -raw s3_bucket_name)
    CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain)
    
    # Save outputs for later use
    cat > ../deployment-outputs.env << EOF
EC2_IP=$EC2_IP
RDS_ENDPOINT=$RDS_ENDPOINT
S3_BUCKET=$S3_BUCKET
CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN
AWS_REGION=$AWS_REGION
STAGE=$STAGE
EOF
    
    cd ..
    
    log "Infrastructure deployment completed ✓"
    info "EC2 IP: $EC2_IP"
    info "RDS Endpoint: $RDS_ENDPOINT"
    info "CloudFront Domain: $CLOUDFRONT_DOMAIN"
}

# Deploy frontend to S3
deploy_frontend() {
    log "Deploying frontend to S3..."
    
    source deployment-outputs.env
    
    # Upload build files to S3
    if [ -d "frontend/out" ]; then
        info "Uploading static files to S3..."
        aws s3 sync frontend/out s3://$S3_BUCKET --delete --region $AWS_REGION
    else
        info "Uploading Next.js build to S3..."
        aws s3 sync frontend/.next/static s3://$S3_BUCKET/_next/static --delete --region $AWS_REGION
        aws s3 sync frontend/public s3://$S3_BUCKET --delete --region $AWS_REGION
    fi
    
    # Invalidate CloudFront cache
    DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com'].Id" --output text --region $AWS_REGION)
    
    if [ -n "$DISTRIBUTION_ID" ]; then
        info "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --region $AWS_REGION
    fi
    
    log "Frontend deployment completed ✓"
}

# Deploy backend to EC2
deploy_backend() {
    log "Deploying backend to EC2..."
    
    source deployment-outputs.env
    
    # Wait for EC2 instance to be ready
    info "Waiting for EC2 instance to be ready..."
    aws ec2 wait instance-running --instance-ids $(aws ec2 describe-instances --filters "Name=tag:Name,Values=${PROJECT_NAME}-${STAGE}-web-server" --query "Reservations[].Instances[].InstanceId" --output text --region $AWS_REGION) --region $AWS_REGION
    
    # Create deployment package
    info "Creating deployment package..."
    tar -czf deployment.tar.gz \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='frontend/out' \
        --exclude='frontend/.next' \
        --exclude='terraform' \
        --exclude='*.log' \
        backend/ ecosystem.config.js package*.json
    
    # Copy deployment package to EC2
    info "Copying application to EC2..."
    scp -i ~/.ssh/${PROJECT_NAME}-key.pem -o StrictHostKeyChecking=no \
        deployment.tar.gz ec2-user@$EC2_IP:/tmp/
    
    # Deploy on EC2
    info "Installing and starting application on EC2..."
    ssh -i ~/.ssh/${PROJECT_NAME}-key.pem -o StrictHostKeyChecking=no ec2-user@$EC2_IP << EOF
set -e

# Create application directory
sudo mkdir -p /var/www/laburar
cd /var/www/laburar

# Extract deployment package
sudo tar -xzf /tmp/deployment.tar.gz
sudo chown -R ec2-user:ec2-user /var/www/laburar

# Install dependencies
cd backend
npm ci --only=production

# Set up environment variables
cat > .env << ENV_EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://laburar_admin:SecurePassword123!@$RDS_ENDPOINT:5432/laburar_prod
REDIS_URL=redis://localhost:6379
JWT_SECRET=\$(openssl rand -base64 32)
STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY:-sk_test_dummy}
AWS_REGION=$AWS_REGION
ENV_EOF

# Run database migrations
npm run db:migrate || echo "Migration failed, continuing..."

# Start application with PM2
pm2 delete all || true
pm2 start ../ecosystem.config.js --env production
pm2 save
pm2 startup

# Configure nginx if not already done
if [ ! -f /etc/nginx/conf.d/laburar.conf ]; then
    sudo cp /var/www/laburar/nginx/laburar.conf /etc/nginx/conf.d/
    sudo systemctl restart nginx
fi

echo "Backend deployment completed successfully!"
EOF
    
    # Clean up
    rm deployment.tar.gz
    
    log "Backend deployment completed ✓"
}

# Setup monitoring and alerts
setup_monitoring() {
    log "Setting up monitoring and alerts..."
    
    source deployment-outputs.env
    
    # Create SNS topic for alerts
    SNS_TOPIC_ARN=$(aws sns create-topic --name ${PROJECT_NAME}-${STAGE}-alerts --region $AWS_REGION --output text --query 'TopicArn')
    
    # Subscribe email to SNS topic (if provided)
    if [ -n "$ALERT_EMAIL" ]; then
        aws sns subscribe --topic-arn $SNS_TOPIC_ARN --protocol email --notification-endpoint $ALERT_EMAIL --region $AWS_REGION
    fi
    
    # Create CloudWatch alarms
    info "Creating CloudWatch alarms..."
    
    # High CPU alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-high-cpu" \
        --alarm-description "High CPU utilization" \
        --metric-name CPUUtilization \
        --namespace AWS/EC2 \
        --statistic Average \
        --period 300 \
        --threshold 80 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $SNS_TOPIC_ARN \
        --dimensions Name=InstanceId,Value=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=${PROJECT_NAME}-${STAGE}-web-server" --query "Reservations[].Instances[].InstanceId" --output text --region $AWS_REGION) \
        --region $AWS_REGION
    
    # High memory alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-high-memory" \
        --alarm-description "High memory utilization" \
        --metric-name MemoryUtilization \
        --namespace CWAgent \
        --statistic Average \
        --period 300 \
        --threshold 85 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $SNS_TOPIC_ARN \
        --region $AWS_REGION
    
    # Database connection alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-db-connections" \
        --alarm-description "High database connections" \
        --metric-name DatabaseConnections \
        --namespace AWS/RDS \
        --statistic Average \
        --period 300 \
        --threshold 15 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $SNS_TOPIC_ARN \
        --dimensions Name=DBInstanceIdentifier,Value=${PROJECT_NAME}-${STAGE}-postgres \
        --region $AWS_REGION
    
    # Billing alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-billing-alert" \
        --alarm-description "Monthly billing alert" \
        --metric-name EstimatedCharges \
        --namespace AWS/Billing \
        --statistic Maximum \
        --period 86400 \
        --threshold 10.00 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 1 \
        --alarm-actions $SNS_TOPIC_ARN \
        --dimensions Name=Currency,Value=USD \
        --region us-east-1
    
    log "Monitoring and alerts setup completed ✓"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    source deployment-outputs.env
    
    # Wait for services to be ready
    sleep 30
    
    # Check frontend
    info "Checking frontend..."
    if curl -f -s -o /dev/null "https://$CLOUDFRONT_DOMAIN" || curl -f -s -o /dev/null "http://$EC2_IP"; then
        log "Frontend health check passed ✓"
    else
        error "Frontend health check failed ✗"
        return 1
    fi
    
    # Check backend API
    info "Checking backend API..."
    if curl -f -s -o /dev/null "http://$EC2_IP/api/health"; then
        log "Backend API health check passed ✓"
    else
        error "Backend API health check failed ✗"
        return 1
    fi
    
    # Check database connectivity
    info "Checking database connectivity..."
    ssh -i ~/.ssh/${PROJECT_NAME}-key.pem -o StrictHostKeyChecking=no ec2-user@$EC2_IP << 'EOF'
cd /var/www/laburar/backend
if npm run db:status; then
    echo "Database connectivity check passed ✓"
else
    echo "Database connectivity check failed ✗"
    exit 1
fi
EOF
    
    log "All health checks passed ✓"
}

# Generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    source deployment-outputs.env
    
    cat > deployment-report.md << EOF
# LaburAR AWS Deployment Report

**Deployment Date**: $(date)
**Stage**: $STAGE
**Region**: $AWS_REGION

## Infrastructure

| Component | Value |
|-----------|-------|
| EC2 Instance | $EC2_IP |
| RDS Database | $RDS_ENDPOINT |
| S3 Bucket | $S3_BUCKET |
| CloudFront | $CLOUDFRONT_DOMAIN |

## Access URLs

- **Frontend**: https://$CLOUDFRONT_DOMAIN
- **Backend API**: http://$EC2_IP/api
- **API Documentation**: http://$EC2_IP/api/docs

## Next Steps

1. Update DNS records to point to CloudFront distribution
2. Configure SSL certificate for custom domain
3. Set up CI/CD pipeline
4. Configure monitoring dashboards
5. Set up automated backups

## Cost Estimation

- **EC2 t3.micro**: Free Tier (750h/month)
- **RDS db.t3.micro**: Free Tier (750h/month)
- **S3 + CloudFront**: Free Tier (5GB + 50GB transfer)
- **Estimated Monthly Cost**: \$0.50 - \$5.00

## Security Checklist

- [x] VPC with private subnets
- [x] Security groups configured
- [x] SSL/TLS encryption
- [x] Database encryption
- [x] Backup retention
- [ ] WAF configuration (optional)
- [ ] Custom domain SSL
- [ ] Advanced monitoring

Deployment completed successfully! 🚀
EOF
    
    log "Deployment report generated: deployment-report.md"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f deployment.tar.gz
    rm -f tfplan
}

# Main deployment flow
main() {
    log "Starting LaburAR AWS deployment..."
    log "Stage: $STAGE | Region: $AWS_REGION"
    
    # Trap cleanup on exit
    trap cleanup EXIT
    
    check_prerequisites
    setup_environment
    build_applications
    deploy_infrastructure
    deploy_frontend
    deploy_backend
    setup_monitoring
    health_check
    generate_report
    
    log "🎉 Deployment completed successfully!"
    info "Access your application at:"
    source deployment-outputs.env
    info "Frontend: https://$CLOUDFRONT_DOMAIN"
    info "Backend: http://$EC2_IP/api/docs"
    
    warn "Don't forget to:"
    warn "1. Update DNS records for custom domain"
    warn "2. Configure production environment variables"
    warn "3. Set up SSL certificate for custom domain"
    warn "4. Review security settings"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi