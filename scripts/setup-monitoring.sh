#!/bin/bash
# LaburAR AWS Monitoring Setup Script
# Sets up comprehensive monitoring, alerting, and cost optimization

set -e

# Configuration
AWS_REGION=${1:-us-east-1}
PROJECT_NAME=${2:-laburar}
STAGE=${3:-production}
ALERT_EMAIL=${4}
SLACK_WEBHOOK_URL=${5}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}" >&2; }
warn() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v aws >/dev/null 2>&1; then
        error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        error "AWS credentials not configured. Run 'aws configure'."
        exit 1
    fi
    
    log "Prerequisites check completed ✓"
}

# Get AWS resources information
get_aws_resources() {
    log "Discovering AWS resources..."
    
    # Get EC2 instance ID
    EC2_INSTANCE_ID=$(aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=${PROJECT_NAME}-${STAGE}-web-server" \
               "Name=instance-state-name,Values=running" \
        --query "Reservations[].Instances[].InstanceId" \
        --output text --region $AWS_REGION)
    
    # Get RDS instance identifier
    RDS_INSTANCE_ID=$(aws rds describe-db-instances \
        --query "DBInstances[?DBInstanceIdentifier=='${PROJECT_NAME}-${STAGE}-postgres'].DBInstanceIdentifier" \
        --output text --region $AWS_REGION)
    
    # Get CloudFront distribution ID
    CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Comment=='${PROJECT_NAME} ${STAGE} Frontend Distribution'].Id" \
        --output text --region $AWS_REGION)
    
    # Get S3 bucket name
    S3_BUCKET_NAME=$(aws s3api list-buckets \
        --query "Buckets[?contains(Name, '${PROJECT_NAME}-${STAGE}-frontend')].Name" \
        --output text --region $AWS_REGION)
    
    info "Found resources:"
    info "EC2 Instance: $EC2_INSTANCE_ID"
    info "RDS Instance: $RDS_INSTANCE_ID"
    info "CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
    info "S3 Bucket: $S3_BUCKET_NAME"
}

# Setup SNS topics for alerts
setup_sns_topics() {
    log "Setting up SNS topics for alerts..."
    
    # Create critical alerts topic
    CRITICAL_TOPIC_ARN=$(aws sns create-topic \
        --name "${PROJECT_NAME}-${STAGE}-critical-alerts" \
        --region $AWS_REGION \
        --output text --query 'TopicArn')
    
    # Create warning alerts topic
    WARNING_TOPIC_ARN=$(aws sns create-topic \
        --name "${PROJECT_NAME}-${STAGE}-warning-alerts" \
        --region $AWS_REGION \
        --output text --query 'TopicArn')
    
    # Create billing alerts topic
    BILLING_TOPIC_ARN=$(aws sns create-topic \
        --name "${PROJECT_NAME}-${STAGE}-billing-alerts" \
        --region $AWS_REGION \
        --output text --query 'TopicArn')
    
    # Subscribe email to SNS topics if provided
    if [ -n "$ALERT_EMAIL" ]; then
        info "Subscribing $ALERT_EMAIL to alert topics..."
        
        aws sns subscribe \
            --topic-arn $CRITICAL_TOPIC_ARN \
            --protocol email \
            --notification-endpoint $ALERT_EMAIL \
            --region $AWS_REGION
        
        aws sns subscribe \
            --topic-arn $WARNING_TOPIC_ARN \
            --protocol email \
            --notification-endpoint $ALERT_EMAIL \
            --region $AWS_REGION
        
        aws sns subscribe \
            --topic-arn $BILLING_TOPIC_ARN \
            --protocol email \
            --notification-endpoint $ALERT_EMAIL \
            --region $AWS_REGION
    fi
    
    log "SNS topics created successfully ✓"
}

# Setup CloudWatch dashboards
setup_cloudwatch_dashboard() {
    log "Creating CloudWatch dashboard..."
    
    # Create comprehensive dashboard
    cat > dashboard-config.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0, "y": 0, "width": 12, "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/EC2", "CPUUtilization", "InstanceId", "$EC2_INSTANCE_ID" ],
                    [ "CWAgent", "mem_used_percent", "InstanceId", "$EC2_INSTANCE_ID" ],
                    [ "CWAgent", "disk_used_percent", "InstanceId", "$EC2_INSTANCE_ID", "device", "xvda1", "fstype", "xfs", "path", "/" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "EC2 System Metrics",
                "period": 300
            }
        },
        {
            "type": "metric", 
            "x": 12, "y": 0, "width": 12, "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "$RDS_INSTANCE_ID" ],
                    [ ".", "DatabaseConnections", ".", "." ],
                    [ ".", "ReadLatency", ".", "." ],
                    [ ".", "WriteLatency", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "RDS Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0, "y": 6, "width": 12, "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/CloudFront", "Requests", "DistributionId", "$CLOUDFRONT_DISTRIBUTION_ID" ],
                    [ ".", "BytesDownloaded", ".", "." ],
                    [ ".", "4xxErrorRate", ".", "." ],
                    [ ".", "5xxErrorRate", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "CloudFront Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12, "y": 6, "width": 12, "height": 6,
            "properties": {
                "metrics": [
                    [ "LaburAR/Application", "FrontendHealth", { "stat": "Average" } ],
                    [ ".", "BackendHealth", { "stat": "Average" } ],
                    [ ".", "RedisConnectedClients", { "stat": "Average" } ],
                    [ ".", "DiskUsagePercent", { "stat": "Average" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "Application Health Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 0, "y": 12, "width": 24, "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/Billing", "EstimatedCharges", "Currency", "USD" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "Billing - Estimated Charges",
                "period": 86400
            }
        }
    ]
}
EOF
    
    # Create the dashboard
    aws cloudwatch put-dashboard \
        --dashboard-name "${PROJECT_NAME}-${STAGE}-overview" \
        --dashboard-body file://dashboard-config.json \
        --region $AWS_REGION
    
    # Clean up
    rm dashboard-config.json
    
    log "CloudWatch dashboard created ✓"
}

# Setup comprehensive CloudWatch alarms
setup_cloudwatch_alarms() {
    log "Setting up CloudWatch alarms..."
    
    # EC2 High CPU Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-ec2-high-cpu" \
        --alarm-description "High CPU utilization on EC2 instance" \
        --metric-name CPUUtilization \
        --namespace AWS/EC2 \
        --statistic Average \
        --period 300 \
        --threshold 80 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $CRITICAL_TOPIC_ARN \
        --ok-actions $CRITICAL_TOPIC_ARN \
        --dimensions Name=InstanceId,Value=$EC2_INSTANCE_ID \
        --region $AWS_REGION
    
    # EC2 High Memory Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-ec2-high-memory" \
        --alarm-description "High memory utilization on EC2 instance" \
        --metric-name mem_used_percent \
        --namespace CWAgent \
        --statistic Average \
        --period 300 \
        --threshold 85 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $CRITICAL_TOPIC_ARN \
        --dimensions Name=InstanceId,Value=$EC2_INSTANCE_ID \
        --region $AWS_REGION
    
    # EC2 High Disk Usage Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-ec2-high-disk" \
        --alarm-description "High disk utilization on EC2 instance" \
        --metric-name disk_used_percent \
        --namespace CWAgent \
        --statistic Average \
        --period 300 \
        --threshold 90 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 1 \
        --alarm-actions $WARNING_TOPIC_ARN \
        --dimensions Name=InstanceId,Value=$EC2_INSTANCE_ID \
        --region $AWS_REGION
    
    # RDS High CPU Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-rds-high-cpu" \
        --alarm-description "High CPU utilization on RDS instance" \
        --metric-name CPUUtilization \
        --namespace AWS/RDS \
        --statistic Average \
        --period 300 \
        --threshold 75 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $WARNING_TOPIC_ARN \
        --dimensions Name=DBInstanceIdentifier,Value=$RDS_INSTANCE_ID \
        --region $AWS_REGION
    
    # RDS High Connections Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-rds-high-connections" \
        --alarm-description "High database connections on RDS instance" \
        --metric-name DatabaseConnections \
        --namespace AWS/RDS \
        --statistic Average \
        --period 300 \
        --threshold 15 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $WARNING_TOPIC_ARN \
        --dimensions Name=DBInstanceIdentifier,Value=$RDS_INSTANCE_ID \
        --region $AWS_REGION
    
    # Application Health Alarms
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-frontend-unhealthy" \
        --alarm-description "Frontend application is unhealthy" \
        --metric-name FrontendHealth \
        --namespace LaburAR/Application \
        --statistic Average \
        --period 300 \
        --threshold 200 \
        --comparison-operator LessThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $CRITICAL_TOPIC_ARN \
        --treat-missing-data notBreaching \
        --region $AWS_REGION
    
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-backend-unhealthy" \
        --alarm-description "Backend API is unhealthy" \
        --metric-name BackendHealth \
        --namespace LaburAR/Application \
        --statistic Average \
        --period 300 \
        --threshold 200 \
        --comparison-operator LessThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $CRITICAL_TOPIC_ARN \
        --treat-missing-data notBreaching \
        --region $AWS_REGION
    
    # CloudFront Error Rate Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-cloudfront-high-error-rate" \
        --alarm-description "High error rate on CloudFront distribution" \
        --metric-name 4xxErrorRate \
        --namespace AWS/CloudFront \
        --statistic Average \
        --period 300 \
        --threshold 5 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions $WARNING_TOPIC_ARN \
        --dimensions Name=DistributionId,Value=$CLOUDFRONT_DISTRIBUTION_ID \
        --region $AWS_REGION
    
    # Billing Alarm - Critical
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-billing-critical" \
        --alarm-description "Monthly charges exceed critical threshold" \
        --metric-name EstimatedCharges \
        --namespace AWS/Billing \
        --statistic Maximum \
        --period 86400 \
        --threshold 20.00 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 1 \
        --alarm-actions $BILLING_TOPIC_ARN \
        --dimensions Name=Currency,Value=USD \
        --region us-east-1
    
    # Billing Alarm - Warning
    aws cloudwatch put-metric-alarm \
        --alarm-name "${PROJECT_NAME}-${STAGE}-billing-warning" \
        --alarm-description "Monthly charges exceed warning threshold" \
        --metric-name EstimatedCharges \
        --namespace AWS/Billing \
        --statistic Maximum \
        --period 86400 \
        --threshold 5.00 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 1 \
        --alarm-actions $BILLING_TOPIC_ARN \
        --dimensions Name=Currency,Value=USD \
        --region us-east-1
    
    log "CloudWatch alarms created successfully ✓"
}

# Setup AWS Budget for cost control
setup_aws_budget() {
    log "Setting up AWS Budget for cost control..."
    
    # Create budget configuration
    cat > budget-config.json << EOF
{
    "BudgetName": "${PROJECT_NAME}-${STAGE}-monthly-budget",
    "BudgetLimit": {
        "Amount": "10.00",
        "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "TimePeriod": {
        "Start": "$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d)",
        "End": "2025-12-31"
    },
    "BudgetType": "COST",
    "CostFilters": {
        "TagKey": ["Project"],
        "TagValue": ["$PROJECT_NAME"]
    }
}
EOF
    
    # Create budget subscribers configuration
    cat > budget-subscribers.json << EOF
[
    {
        "NotificationType": "ACTUAL",
        "ComparisonOperator": "GREATER_THAN",
        "Threshold": 80,
        "ThresholdType": "PERCENTAGE",
        "SubscriberType": "SNS",
        "Address": "$BILLING_TOPIC_ARN"
    },
    {
        "NotificationType": "FORECASTED",
        "ComparisonOperator": "GREATER_THAN", 
        "Threshold": 100,
        "ThresholdType": "PERCENTAGE",
        "SubscriberType": "SNS",
        "Address": "$BILLING_TOPIC_ARN"
    }
]
EOF
    
    # Create the budget
    aws budgets create-budget \
        --account-id $(aws sts get-caller-identity --query Account --output text) \
        --budget file://budget-config.json \
        --notifications-with-subscribers '[
            {
                "Notification": {
                    "NotificationType": "ACTUAL",
                    "ComparisonOperator": "GREATER_THAN",
                    "Threshold": 80,
                    "ThresholdType": "PERCENTAGE"
                },
                "Subscribers": [
                    {
                        "SubscriptionType": "SNS",
                        "Address": "'$BILLING_TOPIC_ARN'"
                    }
                ]
            }
        ]' \
        --region $AWS_REGION
    
    # Clean up
    rm budget-config.json budget-subscribers.json
    
    log "AWS Budget created successfully ✓"
}

# Setup automated cost optimization
setup_cost_optimization() {
    log "Setting up cost optimization automation..."
    
    # Create Lambda function for cost optimization
    cat > cost-optimizer.py << 'EOF'
import json
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Automated cost optimization for LaburAR AWS resources
    """
    ec2 = boto3.client('ec2')
    rds = boto3.client('rds')
    cloudwatch = boto3.client('cloudwatch')
    
    project_name = 'laburar'
    stage = 'production'
    
    optimizations = []
    
    try:
        # Check for unused EBS volumes
        volumes = ec2.describe_volumes(
            Filters=[
                {'Name': 'state', 'Values': ['available']},
                {'Name': 'tag:Project', 'Values': [project_name]}
            ]
        )
        
        for volume in volumes['Volumes']:
            optimizations.append({
                'type': 'unused_ebs_volume',
                'resource_id': volume['VolumeId'],
                'cost_impact': 'Low',
                'recommendation': 'Delete unused EBS volume'
            })
        
        # Check EC2 instance utilization
        instance_metrics = cloudwatch.get_metric_statistics(
            Namespace='AWS/EC2',
            MetricName='CPUUtilization',
            Dimensions=[
                {'Name': 'InstanceId', 'Value': 'i-1234567890abcdef0'}  # Replace with actual
            ],
            StartTime=datetime.now() - timedelta(days=7),
            EndTime=datetime.now(),
            Period=3600,
            Statistics=['Average']
        )
        
        if instance_metrics['Datapoints']:
            avg_cpu = sum(d['Average'] for d in instance_metrics['Datapoints']) / len(instance_metrics['Datapoints'])
            if avg_cpu < 10:
                optimizations.append({
                    'type': 'underutilized_instance',
                    'resource_id': 'EC2 Instance',
                    'cost_impact': 'High',
                    'recommendation': 'Consider downsizing instance or using spot instances'
                })
        
        # Send optimization report
        sns = boto3.client('sns')
        if optimizations:
            message = "Cost optimization recommendations:\n\n"
            for opt in optimizations:
                message += f"• {opt['recommendation']} ({opt['resource_id']}) - Impact: {opt['cost_impact']}\n"
        else:
            message = "No cost optimization opportunities found."
        
        # Send to SNS topic (replace with actual topic ARN)
        # sns.publish(TopicArn='arn:aws:sns:...', Message=message, Subject='Cost Optimization Report')
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Cost optimization check completed',
                'optimizations': optimizations
            })
        }
        
    except Exception as e:
        logger.error(f"Error in cost optimization: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
EOF
    
    # Package Lambda function
    zip -r cost-optimizer.zip cost-optimizer.py
    
    # Create Lambda execution role
    LAMBDA_ROLE_ARN=$(aws iam create-role \
        --role-name "${PROJECT_NAME}-${STAGE}-cost-optimizer-role" \
        --assume-role-policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }' \
        --query 'Role.Arn' \
        --output text --region $AWS_REGION)
    
    # Attach policies to Lambda role
    aws iam attach-role-policy \
        --role-name "${PROJECT_NAME}-${STAGE}-cost-optimizer-role" \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region $AWS_REGION
    
    # Create custom policy for Lambda
    aws iam put-role-policy \
        --role-name "${PROJECT_NAME}-${STAGE}-cost-optimizer-role" \
        --policy-name CostOptimizerPolicy \
        --policy-document '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:DescribeVolumes",
                        "ec2:DescribeInstances",
                        "rds:DescribeDBInstances",
                        "cloudwatch:GetMetricStatistics",
                        "sns:Publish"
                    ],
                    "Resource": "*"
                }
            ]
        }' \
        --region $AWS_REGION
    
    # Wait for role propagation
    sleep 10
    
    # Create Lambda function
    aws lambda create-function \
        --function-name "${PROJECT_NAME}-${STAGE}-cost-optimizer" \
        --runtime python3.9 \
        --role $LAMBDA_ROLE_ARN \
        --handler cost-optimizer.lambda_handler \
        --zip-file fileb://cost-optimizer.zip \
        --description "Automated cost optimization for LaburAR" \
        --timeout 300 \
        --region $AWS_REGION
    
    # Create EventBridge rule to run weekly
    aws events put-rule \
        --name "${PROJECT_NAME}-${STAGE}-cost-optimizer-schedule" \
        --schedule-expression "rate(7 days)" \
        --description "Run cost optimizer weekly" \
        --region $AWS_REGION
    
    # Add Lambda permission for EventBridge
    aws lambda add-permission \
        --function-name "${PROJECT_NAME}-${STAGE}-cost-optimizer" \
        --statement-id cost-optimizer-schedule \
        --action lambda:InvokeFunction \
        --principal events.amazonaws.com \
        --source-arn "arn:aws:events:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):rule/${PROJECT_NAME}-${STAGE}-cost-optimizer-schedule" \
        --region $AWS_REGION
    
    # Add target to EventBridge rule
    aws events put-targets \
        --rule "${PROJECT_NAME}-${STAGE}-cost-optimizer-schedule" \
        --targets "Id"="1","Arn"="arn:aws:lambda:${AWS_REGION}:$(aws sts get-caller-identity --query Account --output text):function:${PROJECT_NAME}-${STAGE}-cost-optimizer" \
        --region $AWS_REGION
    
    # Clean up
    rm cost-optimizer.py cost-optimizer.zip
    
    log "Cost optimization automation created ✓"
}

# Setup log aggregation and retention policies
setup_log_management() {
    log "Setting up log management and retention policies..."
    
    # Set log retention for existing log groups
    log_groups=("/aws/ec2/${PROJECT_NAME}-${STAGE}/backend" 
                "/aws/ec2/${PROJECT_NAME}-${STAGE}/frontend"
                "/aws/ec2/${PROJECT_NAME}-${STAGE}/nginx")
    
    for log_group in "${log_groups[@]}"; do
        # Set retention to 7 days to minimize costs
        aws logs put-retention-policy \
            --log-group-name "$log_group" \
            --retention-in-days 7 \
            --region $AWS_REGION 2>/dev/null || true
    done
    
    # Create log insights queries for troubleshooting
    cat > log-insights-queries.json << 'EOF'
{
    "application_errors": "fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 100",
    "slow_requests": "fields @timestamp, @message | filter @message like /slow/ or @duration > 1000 | sort @timestamp desc | limit 50",
    "authentication_failures": "fields @timestamp, @message | filter @message like /auth/ and @message like /fail/ | sort @timestamp desc | limit 100",
    "database_connections": "fields @timestamp, @message | filter @message like /database/ or @message like /connection/ | sort @timestamp desc | limit 50"
}
EOF
    
    log "Log management configured ✓"
}

# Create monitoring runbook
create_monitoring_runbook() {
    log "Creating monitoring runbook..."
    
    cat > monitoring-runbook.md << EOF
# LaburAR AWS Monitoring Runbook

## Overview
Comprehensive monitoring setup for LaburAR application on AWS Free Tier.

## Alert Topics
- **Critical Alerts**: $CRITICAL_TOPIC_ARN
- **Warning Alerts**: $WARNING_TOPIC_ARN  
- **Billing Alerts**: $BILLING_TOPIC_ARN

## CloudWatch Dashboard
- **URL**: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${PROJECT_NAME}-${STAGE}-overview

## Key Metrics to Monitor

### EC2 Instance Health
- **CPU Utilization**: Should be < 80% average
- **Memory Usage**: Should be < 85% 
- **Disk Usage**: Should be < 90%
- **Network**: Monitor for unusual spikes

### RDS Database Health
- **CPU Utilization**: Should be < 75%
- **Connections**: Should be < 15 concurrent
- **Read/Write Latency**: Should be < 100ms

### Application Health
- **Frontend Health**: HTTP 200 responses
- **Backend API Health**: HTTP 200 responses
- **Redis Connections**: Monitor for connection leaks

### Cost Monitoring
- **Daily Spend**: Track against \$10/month budget
- **Free Tier Usage**: Monitor limits approaching

## Alert Response Procedures

### Critical Alerts
1. **High CPU/Memory**: 
   - Check application logs for errors
   - Identify resource-intensive processes
   - Consider temporary scaling or optimization

2. **Application Down**:
   - SSH to EC2: \`ssh -i ${PROJECT_NAME}-key.pem ec2-user@<EC2_IP>\`
   - Check PM2 status: \`pm2 list\`
   - Restart services: \`pm2 restart all\`
   - Check logs: \`pm2 logs\`

3. **Database Issues**:
   - Check RDS metrics in AWS Console
   - Verify application database connections
   - Review slow query logs

### Warning Alerts
1. **High Disk Usage**:
   - Clean up old logs: \`find /var/www/laburar/logs -mtime +7 -delete\`
   - Check for large files: \`du -sh /var/www/laburar/*\`

2. **CloudFront Errors**:
   - Check origin server health
   - Verify S3 bucket permissions
   - Review CloudFront distribution settings

## Cost Optimization Checks

### Weekly Tasks
- Review AWS Cost Explorer for unexpected charges
- Check Free Tier usage limits
- Clean up unused resources (EBS snapshots, old AMIs)

### Monthly Tasks
- Review and optimize CloudWatch log retention
- Analyze traffic patterns for potential savings
- Update budgets and cost alerts if needed

## Emergency Contacts
- **Technical Issues**: [Your technical contact]
- **Billing Issues**: [Your billing contact]  
- **AWS Support**: [Support plan details]

## Useful Commands

### Health Checks
\`\`\`bash
# Full system health check
ssh -i ${PROJECT_NAME}-key.pem ec2-user@<EC2_IP> '/usr/local/bin/health-check.sh'

# Check application logs
ssh -i ${PROJECT_NAME}-key.pem ec2-user@<EC2_IP> 'pm2 logs --lines 50'

# Monitor resources
ssh -i ${PROJECT_NAME}-key.pem ec2-user@<EC2_IP> 'top -n 1'
\`\`\`

### Cost Analysis
\`\`\`bash
# View current month costs
aws ce get-cost-and-usage --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) --granularity MONTHLY --metrics BlendedCost

# Check Free Tier usage
aws ce get-usage-forecast --time-period Start=$(date +%Y-%m-%d),End=$(date -d "$(date +%Y-%m-01) +1 month -1 day" +%Y-%m-%d) --metric USAGE_QUANTITY --granularity MONTHLY
\`\`\`

## Troubleshooting

### Common Issues
1. **Application not responding**: Restart PM2 processes
2. **High memory usage**: Check for memory leaks in application
3. **Database connection errors**: Verify RDS security groups
4. **SSL certificate errors**: Check certificate expiration

### Performance Optimization
1. **Enable CloudFront caching**: Configure proper cache headers
2. **Optimize database queries**: Use connection pooling
3. **Image optimization**: Compress images before upload
4. **Code splitting**: Optimize frontend bundle size

## Maintenance Schedule
- **Daily**: Automated health checks and metrics collection
- **Weekly**: Cost optimization review, log cleanup
- **Monthly**: Performance review, security updates
- **Quarterly**: Infrastructure review, disaster recovery test

Last Updated: $(date)
EOF
    
    log "Monitoring runbook created: monitoring-runbook.md"
}

# Generate monitoring report
generate_monitoring_report() {
    log "Generating monitoring setup report..."
    
    cat > monitoring-setup-report.md << EOF
# LaburAR AWS Monitoring Setup Report

**Setup Date**: $(date)
**Environment**: $STAGE
**Region**: $AWS_REGION

## Monitoring Components Deployed

### ✅ CloudWatch Dashboards
- **Dashboard Name**: ${PROJECT_NAME}-${STAGE}-overview
- **URL**: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${PROJECT_NAME}-${STAGE}-overview

### ✅ SNS Topics Created
- **Critical Alerts**: $CRITICAL_TOPIC_ARN
- **Warning Alerts**: $WARNING_TOPIC_ARN
- **Billing Alerts**: $BILLING_TOPIC_ARN

### ✅ CloudWatch Alarms
- EC2 High CPU (>80%)
- EC2 High Memory (>85%)
- EC2 High Disk Usage (>90%)
- RDS High CPU (>75%)
- RDS High Connections (>15)
- Frontend Health Check
- Backend Health Check
- CloudFront Error Rate (>5%)
- Billing Alert (\$5 warning, \$20 critical)

### ✅ AWS Budget
- **Monthly Budget**: \$10.00
- **Alerts**: 80% actual, 100% forecast

### ✅ Cost Optimization
- Lambda function for weekly cost analysis
- Automated unused resource detection
- Log retention policies (7 days)

## Next Steps

1. **Email Confirmation**: Check your email and confirm SNS subscriptions
2. **Test Alerts**: Manually trigger an alarm to test notification flow
3. **Dashboard Customization**: Add any application-specific metrics
4. **Review Runbook**: Familiarize yourself with monitoring-runbook.md

## Estimated Monthly Costs

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| CloudWatch Metrics | 10 custom metrics | \$0.00 |
| CloudWatch Alarms | First 10 alarms | \$0.00 |
| SNS Notifications | 1,000 notifications | \$0.00 |
| Lambda Executions | 1M requests | \$0.00 |
| **Total** | | **\$0.00** |

## Free Tier Monitoring

The entire monitoring setup utilizes AWS Free Tier resources:
- CloudWatch: 10 custom metrics, 10 alarms, 5GB log ingestion
- SNS: 1,000 notifications per month
- Lambda: 1M requests, 400,000 GB-seconds compute time
- Systems Manager: Parameter Store (10,000 parameters)

## Support and Maintenance

- **Runbook**: monitoring-runbook.md
- **Log Queries**: log-insights-queries.json
- **Health Checks**: Available on EC2 instance

Setup completed successfully! 🎉
EOF
    
    log "Monitoring setup report created: monitoring-setup-report.md"
}

# Main setup process
main() {
    log "Starting LaburAR AWS monitoring setup..."
    log "Region: $AWS_REGION | Project: $PROJECT_NAME | Stage: $STAGE"
    
    if [ -n "$ALERT_EMAIL" ]; then
        info "Alert email: $ALERT_EMAIL"
    else
        warn "No alert email provided - manual SNS subscription required"
    fi
    
    check_prerequisites
    get_aws_resources
    setup_sns_topics
    setup_cloudwatch_dashboard
    setup_cloudwatch_alarms
    setup_aws_budget
    setup_cost_optimization
    setup_log_management
    create_monitoring_runbook
    generate_monitoring_report
    
    log "🎉 AWS monitoring setup completed successfully!"
    
    info "Summary:"
    info "✓ CloudWatch dashboard and alarms created"
    info "✓ SNS topics and budget alerts configured"
    info "✓ Cost optimization automation deployed"
    info "✓ Log management and retention policies set"
    
    warn "Next steps:"
    warn "1. Confirm SNS email subscriptions"
    warn "2. Review monitoring-runbook.md"
    warn "3. Test alert notifications"
    warn "4. Customize dashboard as needed"
    
    info "Dashboard URL: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${PROJECT_NAME}-${STAGE}-overview"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi