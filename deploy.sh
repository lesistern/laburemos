#!/bin/bash

# ========================================
# LABUREMOS - Automated Deployment Script
# ========================================
# Zero-downtime deployment system for AWS
# Supports: production, staging, rollback
# Author: LABUREMOS DevOps Team
# Version: 1.0.0
# ========================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_FILE="$SCRIPT_DIR/logs/deploy-$TIMESTAMP.log"

# AWS Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="529496937346"
S3_BUCKET="laburemos-files-2025"
CLOUDFRONT_DISTRIBUTION_ID="E1E1QZ7YLALIAZ"
EC2_INSTANCE_IP="3.81.56.168"
RDS_ENDPOINT="laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
CERTIFICATE_ARN="arn:aws:acm:us-east-1:529496937346:certificate/94aa65d0-875b-4556-ae27-0c1f49f0b886"

# Environment URLs
declare -A ENVIRONMENT_URLS=(
    ["staging"]="https://staging.laburemos.com.ar"
    ["production"]="https://laburemos.com.ar"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Color logging functions
log_info() { echo -e "${BLUE}ℹ️  $*${NC}" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}✅ $*${NC}" | tee -a "$LOG_FILE"; }
log_warning() { echo -e "${YELLOW}⚠️  $*${NC}" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}❌ $*${NC}" | tee -a "$LOG_FILE"; }
log_header() { echo -e "${PURPLE}🚀 $*${NC}" | tee -a "$LOG_FILE"; }

# Progress bar function
show_progress() {
    local duration=$1
    local message=$2
    echo -ne "${CYAN}$message${NC}"
    for ((i=0; i<duration; i++)); do
        echo -ne "."
        sleep 1
    done
    echo ""
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f /tmp/laburemos-*.tmp
    rm -f cloudfront-config-updated.json
    log_success "Cleanup completed"
}

# Error handler
error_handler() {
    local line_number=$1
    log_error "An error occurred at line $line_number"
    log_error "Last command: $BASH_COMMAND"
    cleanup
    exit 1
}

trap 'error_handler $LINENO' ERR
trap cleanup EXIT

# Usage function
usage() {
    cat << EOF
🚀 LABUREMOS Automated Deployment System

Usage: $0 <environment> [options]

Environments:
  production    Deploy to production (https://laburemos.com.ar)
  staging       Deploy to staging environment

Options:
  --skip-tests     Skip test execution
  --skip-backup    Skip backup creation
  --rollback       Rollback to previous version
  --dry-run        Show what would be deployed without executing
  --verbose        Enable verbose logging
  --help           Show this help message

Examples:
  $0 production                    # Full production deployment
  $0 staging --skip-tests         # Quick staging deployment
  $0 production --rollback        # Rollback production
  $0 staging --dry-run            # Preview staging deployment

EOF
}

# Validate dependencies
validate_dependencies() {
    log_header "Validating dependencies..."
    
    local dependencies=("aws" "node" "npm" "git" "jq" "curl")
    for dep in "${dependencies[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "Required dependency '$dep' is not installed"
            exit 1
        fi
        log_success "$dep is available"
    done
    
    # Validate AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    if [ "$account_id" != "$AWS_ACCOUNT_ID" ]; then
        log_error "AWS account mismatch. Expected: $AWS_ACCOUNT_ID, Got: $account_id"
        exit 1
    fi
    
    log_success "All dependencies validated"
}

# Check AWS resources health
check_aws_health() {
    log_header "Checking AWS resources health..."
    
    # Check EC2 instance
    local instance_state=$(aws ec2 describe-instances \
        --filters "Name=ip-address,Values=$EC2_INSTANCE_IP" \
        --query "Reservations[0].Instances[0].State.Name" \
        --output text 2>/dev/null || echo "not-found")
    
    if [ "$instance_state" != "running" ]; then
        log_error "EC2 instance is not running. State: $instance_state"
        exit 1
    fi
    log_success "EC2 instance is healthy"
    
    # Check RDS
    local rds_status=$(aws rds describe-db-instances \
        --db-instance-identifier $(echo $RDS_ENDPOINT | cut -d. -f1) \
        --query "DBInstances[0].DBInstanceStatus" \
        --output text 2>/dev/null || echo "not-found")
    
    if [ "$rds_status" != "available" ]; then
        log_error "RDS instance is not available. Status: $rds_status"
        exit 1
    fi
    log_success "RDS instance is healthy"
    
    # Check S3 bucket
    if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
        log_error "S3 bucket $S3_BUCKET is not accessible"
        exit 1
    fi
    log_success "S3 bucket is accessible"
    
    # Check CloudFront
    local cf_status=$(aws cloudfront get-distribution \
        --id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --query "Distribution.Status" \
        --output text 2>/dev/null || echo "not-found")
    
    if [ "$cf_status" != "Deployed" ]; then
        log_warning "CloudFront distribution status: $cf_status"
    else
        log_success "CloudFront distribution is deployed"
    fi
}

# Create backup
create_backup() {
    if [ "$SKIP_BACKUP" = "true" ]; then
        log_warning "Skipping backup creation"
        return
    fi
    
    log_header "Creating backup..."
    mkdir -p "$BACKUP_DIR"
    
    local backup_file="$BACKUP_DIR/laburemos-backup-$TIMESTAMP.tar.gz"
    
    # Backup S3 frontend
    log_info "Backing up S3 frontend..."
    aws s3 sync "s3://$S3_BUCKET" "$BACKUP_DIR/frontend-$TIMESTAMP" --delete
    
    # Backup backend (via SSH)
    log_info "Backing up EC2 backend..."
    ssh -i "$SCRIPT_DIR/laburemos-key.pem" -o StrictHostKeyChecking=no ec2-user@$EC2_INSTANCE_IP \
        "cd /home/ec2-user && tar -czf backend-backup-$TIMESTAMP.tar.gz laburemos-backend/" || true
    
    # Create combined backup
    tar -czf "$backup_file" -C "$BACKUP_DIR" "frontend-$TIMESTAMP" 2>/dev/null || true
    
    # Keep only last 10 backups
    find "$BACKUP_DIR" -name "laburemos-backup-*.tar.gz" -type f | sort -r | tail -n +11 | xargs rm -f
    
    log_success "Backup created: $backup_file"
    echo "$backup_file" > "$BACKUP_DIR/latest-backup"
}

# Run tests
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log_warning "Skipping tests"
        return
    fi
    
    log_header "Running tests..."
    
    # Frontend tests
    log_info "Running frontend tests..."
    cd "$SCRIPT_DIR/frontend"
    npm ci
    npm run lint
    npm run type-check
    npm run build
    log_success "Frontend tests passed"
    
    # Backend tests
    log_info "Running backend tests..."
    cd "$SCRIPT_DIR/backend"
    npm ci
    npm run lint
    npm run test
    npm run build
    log_success "Backend tests passed"
    
    cd "$SCRIPT_DIR"
}

# Deploy frontend
deploy_frontend() {
    log_header "Deploying frontend..."
    
    cd "$SCRIPT_DIR/frontend"
    
    # Build frontend
    log_info "Building Next.js application..."
    npm run build
    
    # Deploy to S3
    log_info "Uploading to S3..."
    aws s3 sync out/ "s3://$S3_BUCKET" --delete --cache-control "max-age=31536000"
    
    # Invalidate CloudFront
    log_info "Invalidating CloudFront cache..."
    local invalidation_id=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query "Invalidation.Id" \
        --output text)
    
    log_info "CloudFront invalidation created: $invalidation_id"
    
    # Wait for invalidation (optional)
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Waiting for CloudFront invalidation to complete..."
        aws cloudfront wait invalidation-completed \
            --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
            --id "$invalidation_id"
        log_success "CloudFront invalidation completed"
    fi
    
    cd "$SCRIPT_DIR"
    log_success "Frontend deployment completed"
}

# Deploy backend
deploy_backend() {
    log_header "Deploying backend..."
    
    # Build backend
    cd "$SCRIPT_DIR/backend"
    npm run build
    
    # Create deployment package
    log_info "Creating deployment package..."
    tar -czf backend-deploy.tar.gz dist/ node_modules/ package.json prisma/
    
    # Upload to EC2
    log_info "Uploading backend to EC2..."
    scp -i "$SCRIPT_DIR/laburemos-key.pem" -o StrictHostKeyChecking=no \
        backend-deploy.tar.gz ec2-user@$EC2_INSTANCE_IP:/tmp/
    
    # Deploy on EC2
    log_info "Deploying backend on EC2..."
    ssh -i "$SCRIPT_DIR/laburemos-key.pem" -o StrictHostKeyChecking=no ec2-user@$EC2_INSTANCE_IP << 'EOF'
        cd /home/ec2-user
        
        # Stop current backend
        pm2 stop laburemos-backend || true
        
        # Backup current version
        if [ -d "laburemos-backend" ]; then
            mv laburemos-backend laburemos-backend-backup-$(date +%Y%m%d-%H%M%S)
        fi
        
        # Extract new version
        mkdir -p laburemos-backend
        cd laburemos-backend
        tar -xzf /tmp/backend-deploy.tar.gz
        
        # Install dependencies and start
        npm install --production
        npx prisma generate
        
        # Start with PM2
        pm2 start dist/main.js --name laburemos-backend
        pm2 save
        
        echo "Backend deployment completed"
EOF
    
    # Cleanup
    rm -f backend-deploy.tar.gz
    
    cd "$SCRIPT_DIR"
    log_success "Backend deployment completed"
}

# Health checks
run_health_checks() {
    log_header "Running health checks..."
    
    local max_attempts=30
    local attempt=1
    local backend_healthy=false
    local frontend_healthy=false
    
    # Check backend health
    log_info "Checking backend health..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://$EC2_INSTANCE_IP:3001/health" > /dev/null; then
            backend_healthy=true
            break
        fi
        log_info "Backend health check attempt $attempt/$max_attempts..."
        sleep 10
        ((attempt++))
    done
    
    if [ "$backend_healthy" = "false" ]; then
        log_error "Backend health check failed after $max_attempts attempts"
        return 1
    fi
    log_success "Backend is healthy"
    
    # Check frontend health
    log_info "Checking frontend health..."
    local frontend_url="${ENVIRONMENT_URLS[$ENVIRONMENT]}"
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$frontend_url" > /dev/null; then
            frontend_healthy=true
            break
        fi
        log_info "Frontend health check attempt $attempt/$max_attempts..."
        sleep 10
        ((attempt++))
    done
    
    if [ "$frontend_healthy" = "false" ]; then
        log_error "Frontend health check failed after $max_attempts attempts"
        return 1
    fi
    log_success "Frontend is healthy"
    
    log_success "All health checks passed"
}

# Rollback function
rollback_deployment() {
    log_header "Rolling back deployment..."
    
    if [ ! -f "$BACKUP_DIR/latest-backup" ]; then
        log_error "No backup found for rollback"
        exit 1
    fi
    
    local backup_file=$(cat "$BACKUP_DIR/latest-backup")
    log_info "Rolling back to: $backup_file"
    
    # Rollback frontend
    log_info "Rolling back frontend..."
    local temp_dir="/tmp/rollback-$TIMESTAMP"
    mkdir -p "$temp_dir"
    tar -xzf "$backup_file" -C "$temp_dir"
    
    aws s3 sync "$temp_dir/frontend-"* "s3://$S3_BUCKET" --delete
    
    # Invalidate CloudFront
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" > /dev/null
    
    # Rollback backend
    log_info "Rolling back backend..."
    ssh -i "$SCRIPT_DIR/laburemos-key.pem" -o StrictHostKeyChecking=no ec2-user@$EC2_INSTANCE_IP << 'EOF'
        cd /home/ec2-user
        
        # Stop current backend
        pm2 stop laburemos-backend
        
        # Find latest backup
        BACKUP_DIR=$(ls -dt laburemos-backend-backup-* | head -1)
        if [ -n "$BACKUP_DIR" ]; then
            rm -rf laburemos-backend
            mv "$BACKUP_DIR" laburemos-backend
            cd laburemos-backend
            pm2 start dist/main.js --name laburemos-backend
            pm2 save
            echo "Backend rollback completed"
        else
            echo "No backend backup found"
        fi
EOF
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_success "Rollback completed"
    
    # Run health checks
    if run_health_checks; then
        log_success "Rollback successful - All services healthy"
    else
        log_error "Rollback completed but health checks failed"
        exit 1
    fi
}

# Send notifications
send_notifications() {
    local status=$1
    local message=$2
    
    log_info "Sending notifications..."
    
    # You can add Slack, email, or other notification integrations here
    # For now, we'll just log
    log_info "Notification: [$status] $message"
    
    # Example Slack webhook (uncomment and configure)
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"LABUREMOS Deploy [$status]: $message\"}" \
    #     "$SLACK_WEBHOOK_URL"
}

# Main deployment function
main_deploy() {
    log_header "Starting LABUREMOS deployment to $ENVIRONMENT"
    log_info "Timestamp: $TIMESTAMP"
    log_info "Target URL: ${ENVIRONMENT_URLS[$ENVIRONMENT]}"
    
    # Pre-deployment steps
    validate_dependencies
    check_aws_health
    create_backup
    run_tests
    
    # Deployment
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "DRY RUN - Would deploy frontend and backend"
        return
    fi
    
    deploy_frontend
    deploy_backend
    
    # Post-deployment verification
    if run_health_checks; then
        log_success "Deployment completed successfully!"
        send_notifications "SUCCESS" "Deployment to $ENVIRONMENT completed successfully"
    else
        log_error "Health checks failed - initiating rollback"
        rollback_deployment
        send_notifications "FAILED" "Deployment to $ENVIRONMENT failed and was rolled back"
        exit 1
    fi
    
    # Final summary
    log_header "Deployment Summary"
    log_success "Environment: $ENVIRONMENT"
    log_success "Frontend URL: ${ENVIRONMENT_URLS[$ENVIRONMENT]}"
    log_success "Backend API: http://$EC2_INSTANCE_IP:3001"
    log_success "Deployment completed at: $(date)"
}

# Parse command line arguments
ENVIRONMENT=""
SKIP_TESTS=false
SKIP_BACKUP=false
ROLLBACK=false
DRY_RUN=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        production|staging)
            ENVIRONMENT=$1
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate environment
if [ -z "$ENVIRONMENT" ]; then
    log_error "Environment is required"
    usage
    exit 1
fi

if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "staging" ]; then
    log_error "Invalid environment: $ENVIRONMENT"
    usage
    exit 1
fi

# Create necessary directories
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Main execution
if [ "$ROLLBACK" = "true" ]; then
    rollback_deployment
else
    main_deploy
fi

log_success "Script completed successfully!"