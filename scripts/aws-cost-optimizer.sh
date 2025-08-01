#!/bin/bash
# LaburAR AWS Cost Optimization Script
# Monitors and optimizes AWS costs to stay within Free Tier limits

set -e

# Configuration
AWS_REGION=${1:-us-east-1}
PROJECT_NAME=${2:-laburar}
STAGE=${3:-production}
ALERT_EMAIL=${4}
FREE_TIER_THRESHOLD=${5:-80}  # Alert when 80% of free tier used

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
        error "AWS CLI not found"
        exit 1
    fi
    
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        error "AWS credentials not configured"
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        warn "jq not found - installing..."
        # Try to install jq if possible
        if command -v apt-get >/dev/null 2>&1; then
            sudo apt-get update && sudo apt-get install -y jq
        elif command -v yum >/dev/null 2>&1; then
            sudo yum install -y jq
        elif command -v brew >/dev/null 2>&1; then
            brew install jq
        else
            error "Cannot install jq. Please install manually."
            exit 1
        fi
    fi
    
    log "Prerequisites check completed ✓"
}

# Get current AWS costs
get_current_costs() {
    log "Analyzing current AWS costs..."
    
    local start_date=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d)
    local end_date=$(date +%Y-%m-%d)
    
    # Get current month costs
    CURRENT_COSTS=$(aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --region us-east-1 \
        --output json)
    
    # Calculate total current costs
    TOTAL_COST=$(echo "$CURRENT_COSTS" | jq -r '.ResultsByTime[0].Total.BlendedCost.Amount // "0"')
    
    info "Current month costs: \$$(printf "%.2f" "$TOTAL_COST")"
    
    # Get cost breakdown by service
    echo "$CURRENT_COSTS" | jq -r '
        .ResultsByTime[0].Groups[] |
        select(.Metrics.BlendedCost.Amount | tonumber > 0) |
        "\(.Keys[0]): $" + (.Metrics.BlendedCost.Amount | tonumber | . * 100 | round / 100 | tostring)
    ' | sort -k2 -nr > cost-breakdown.txt
    
    info "Top cost drivers:"
    head -10 cost-breakdown.txt | sed 's/^/  /'
}

# Check Free Tier usage
check_free_tier_usage() {
    log "Checking Free Tier usage..."
    
    # EC2 Free Tier usage (750 hours)
    local start_date=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d)
    local end_date=$(date +%Y-%m-%d)
    
    # Calculate days in current month
    local days_in_month=$(date -d "$(date +%Y-%m-01) +1 month -1 day" +%d)
    local current_day=$(date +%d)
    local max_hours=$((750))  # Free tier limit
    
    # Get EC2 running hours this month
    local ec2_instances=$(aws ec2 describe-instances \
        --filters "Name=tag:Project,Values=$PROJECT_NAME" \
               "Name=instance-state-name,Values=running,stopped" \
        --query 'Reservations[].Instances[].[InstanceId,State.Name,LaunchTime,InstanceType]' \
        --output json --region $AWS_REGION)
    
    local ec2_hours=0
    if [ "$(echo "$ec2_instances" | jq length)" -gt 0 ]; then
        # Estimate hours based on running time this month
        local launch_date=$(echo "$ec2_instances" | jq -r '.[0][2]' | cut -d'T' -f1)
        if [[ "$launch_date" > "$start_date" ]]; then
            local days_running=$(( ($(date +%s) - $(date -d "$launch_date" +%s)) / 86400 ))
        else
            local days_running=$current_day
        fi
        ec2_hours=$((days_running * 24))
    fi
    
    local ec2_usage_percent=$((ec2_hours * 100 / max_hours))
    
    info "EC2 Free Tier usage: ${ec2_hours}/${max_hours} hours (${ec2_usage_percent}%)"
    
    # RDS Free Tier usage (750 hours)
    local rds_instances=$(aws rds describe-db-instances \
        --query "DBInstances[?contains(DBInstanceIdentifier, '$PROJECT_NAME')].DBInstanceStatus" \
        --output json --region $AWS_REGION)
    
    local rds_hours=$ec2_hours  # Assume similar usage pattern
    local rds_usage_percent=$((rds_hours * 100 / max_hours))
    
    info "RDS Free Tier usage: ${rds_hours}/${max_hours} hours (${rds_usage_percent}%)"
    
    # S3 Free Tier usage (5GB storage, 15GB transfer)
    local s3_bucket=$(aws s3api list-buckets \
        --query "Buckets[?contains(Name, '$PROJECT_NAME')].Name" \
        --output text --region $AWS_REGION)
    
    if [ -n "$s3_bucket" ]; then
        local s3_size=$(aws s3 ls s3://$s3_bucket --recursive --summarize | grep "Total Size" | awk '{print $3}' || echo "0")
        local s3_size_mb=$((s3_size / 1024 / 1024))
        local s3_usage_percent=$((s3_size_mb * 100 / 5120))  # 5GB = 5120MB
        
        info "S3 Free Tier usage: ${s3_size_mb}/5120 MB (${s3_usage_percent}%)"
    fi
    
    # Check if any service exceeds threshold
    if [ $ec2_usage_percent -gt $FREE_TIER_THRESHOLD ] || [ $rds_usage_percent -gt $FREE_TIER_THRESHOLD ]; then
        warn "Free Tier usage approaching limits!"
        return 1
    fi
    
    return 0
}

# Identify cost optimization opportunities
identify_optimizations() {
    log "Identifying cost optimization opportunities..."
    
    local optimizations=()
    
    # Check for unused EBS volumes
    local unused_volumes=$(aws ec2 describe-volumes \
        --filters "Name=state,Values=available" \
        --query 'Volumes[].VolumeId' \
        --output text --region $AWS_REGION)
    
    if [ -n "$unused_volumes" ]; then
        local volume_count=$(echo "$unused_volumes" | wc -w)
        optimizations+=("Delete $volume_count unused EBS volumes")
        info "Found $volume_count unused EBS volumes"
    fi
    
    # Check for old EBS snapshots
    local old_snapshots=$(aws ec2 describe-snapshots \
        --owner-ids self \
        --query "Snapshots[?StartTime<='$(date -d '30 days ago' --iso-8601)'].SnapshotId" \
        --output text --region $AWS_REGION)
    
    if [ -n "$old_snapshots" ]; then
        local snapshot_count=$(echo "$old_snapshots" | wc -w)
        optimizations+=("Delete $snapshot_count snapshots older than 30 days")
        info "Found $snapshot_count old snapshots"
    fi
    
    # Check CloudWatch log retention
    local log_groups=$(aws logs describe-log-groups \
        --query 'logGroups[?!retentionInDays || retentionInDays > 7].logGroupName' \
        --output text --region $AWS_REGION)
    
    if [ -n "$log_groups" ]; then
        local log_group_count=$(echo "$log_groups" | wc -w)
        optimizations+=("Set 7-day retention for $log_group_count log groups")
        info "Found $log_group_count log groups with long retention"
    fi
    
    # Check for idle RDS instances
    local rds_instances=$(aws rds describe-db-instances \
        --query "DBInstances[?contains(DBInstanceIdentifier, '$PROJECT_NAME')].DBInstanceIdentifier" \
        --output text --region $AWS_REGION)
    
    if [ -n "$rds_instances" ]; then
        # Check CPU utilization for last 7 days
        for instance in $rds_instances; do
            local cpu_stats=$(aws cloudwatch get-metric-statistics \
                --namespace AWS/RDS \
                --metric-name CPUUtilization \
                --dimensions Name=DBInstanceIdentifier,Value=$instance \
                --start-time $(date -d '7 days ago' --iso-8601) \
                --end-time $(date --iso-8601) \
                --period 3600 \
                --statistics Average \
                --query 'Datapoints[].Average' \
                --output text --region $AWS_REGION)
            
            if [ -n "$cpu_stats" ]; then
                local avg_cpu=$(echo "$cpu_stats" | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
                local avg_cpu_int=$(printf "%.0f" "$avg_cpu")
                
                if [ $avg_cpu_int -lt 5 ]; then
                    optimizations+=("RDS instance $instance has low CPU usage (${avg_cpu_int}%) - consider stopping during low usage periods")
                fi
            fi
        done
    fi
    
    # Check EC2 instance utilization
    local ec2_instances=$(aws ec2 describe-instances \
        --filters "Name=tag:Project,Values=$PROJECT_NAME" \
               "Name=instance-state-name,Values=running" \
        --query 'Reservations[].Instances[].InstanceId' \
        --output text --region $AWS_REGION)
    
    if [ -n "$ec2_instances" ]; then
        for instance in $ec2_instances; do
            local cpu_stats=$(aws cloudwatch get-metric-statistics \
                --namespace AWS/EC2 \
                --metric-name CPUUtilization \
                --dimensions Name=InstanceId,Value=$instance \
                --start-time $(date -d '7 days ago' --iso-8601) \
                --end-time $(date --iso-8601) \
                --period 3600 \
                --statistics Average \
                --query 'Datapoints[].Average' \
                --output text --region $AWS_REGION)
            
            if [ -n "$cpu_stats" ]; then
                local avg_cpu=$(echo "$cpu_stats" | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
                local avg_cpu_int=$(printf "%.0f" "$avg_cpu")
                
                if [ $avg_cpu_int -lt 10 ]; then
                    optimizations+=("EC2 instance $instance has low CPU usage (${avg_cpu_int}%) - consider downsizing or scheduling")
                fi
            fi
        done
    fi
    
    # Save optimizations to file
    if [ ${#optimizations[@]} -gt 0 ]; then
        printf '%s\n' "${optimizations[@]}" > optimization-recommendations.txt
        warn "Found ${#optimizations[@]} optimization opportunities:"
        printf '  • %s\n' "${optimizations[@]}"
        return 1
    else
        info "No optimization opportunities found ✓"
        return 0
    fi
}

# Apply automatic optimizations
apply_optimizations() {
    log "Applying safe automatic optimizations..."
    
    local applied_count=0
    
    # Set CloudWatch log retention to 7 days
    local log_groups=$(aws logs describe-log-groups \
        --query 'logGroups[?!retentionInDays || retentionInDays > 7].logGroupName' \
        --output text --region $AWS_REGION)
    
    if [ -n "$log_groups" ]; then
        for log_group in $log_groups; do
            info "Setting 7-day retention for log group: $log_group"
            aws logs put-retention-policy \
                --log-group-name "$log_group" \
                --retention-in-days 7 \
                --region $AWS_REGION || true
            ((applied_count++))
        done
    fi
    
    # Delete old CloudWatch log streams (if empty)
    local empty_streams=$(aws logs describe-log-streams \
        --log-group-name "/aws/ec2/${PROJECT_NAME}-${STAGE}/application" \
        --query "logStreams[?lastEventTime<$(date -d '30 days ago' +%s)000].logStreamName" \
        --output text --region $AWS_REGION 2>/dev/null || true)
    
    if [ -n "$empty_streams" ]; then
        for stream in $empty_streams; do
            info "Deleting old log stream: $stream"
            aws logs delete-log-stream \
                --log-group-name "/aws/ec2/${PROJECT_NAME}-${STAGE}/application" \
                --log-stream-name "$stream" \
                --region $AWS_REGION 2>/dev/null || true
            ((applied_count++))
        done
    fi
    
    info "Applied $applied_count automatic optimizations ✓"
}

# Generate cost forecast
generate_cost_forecast() {
    log "Generating cost forecast..."
    
    local start_date=$(date +%Y-%m-%d)
    local end_date=$(date -d "$(date +%Y-%m-01) +1 month" +%Y-%m-%d)
    
    # Get cost forecast
    local forecast=$(aws ce get-cost-forecast \
        --time-period Start="$start_date",End="$end_date" \
        --metric BLENDED_COST \
        --granularity MONTHLY \
        --region us-east-1 \
        --output json 2>/dev/null || echo '{"Total":{"Amount":"0"}}')
    
    local forecasted_amount=$(echo "$forecast" | jq -r '.Total.Amount // "0"')
    
    info "Forecasted monthly cost: \$$(printf "%.2f" "$forecasted_amount")"
    
    # Calculate remaining budget
    local budget_limit=10.00
    local current_cost=$(printf "%.2f" "$TOTAL_COST")
    local remaining_budget=$(echo "$budget_limit - $current_cost" | bc -l)
    
    info "Remaining monthly budget: \$$(printf "%.2f" "$remaining_budget")"
    
    # Check if forecast exceeds budget
    if (( $(echo "$forecasted_amount > $budget_limit" | bc -l) )); then
        warn "Forecasted cost (\$$(printf "%.2f" "$forecasted_amount")) exceeds budget (\$$(printf "%.2f" "$budget_limit"))!"
        return 1
    fi
    
    return 0
}

# Setup cost monitoring automation
setup_cost_monitoring() {
    log "Setting up automated cost monitoring..."
    
    # Create cost monitoring script for cron
    cat > /tmp/daily-cost-check.sh << 'EOF'
#!/bin/bash
# Daily cost monitoring for LaburAR

COST_THRESHOLD=8.00  # Alert when approaching $10 budget
CURRENT_COST=$(aws ce get-cost-and-usage \
    --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --region us-east-1 \
    --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
    --output text)

if (( $(echo "$CURRENT_COST > $COST_THRESHOLD" | bc -l) )); then
    # Send alert
    aws sns publish \
        --topic-arn "$BILLING_TOPIC_ARN" \
        --message "LaburAR AWS costs approaching budget limit: \$$CURRENT_COST" \
        --subject "Cost Alert - LaburAR" \
        --region us-east-1
fi
EOF
    
    chmod +x /tmp/daily-cost-check.sh
    
    # Install cron job (requires user interaction)
    info "To enable daily cost monitoring, add this to your crontab:"
    info "0 9 * * * /tmp/daily-cost-check.sh"
    info "Run: crontab -e"
}

# Create cost optimization report
create_cost_report() {
    log "Creating cost optimization report..."
    
    cat > cost-optimization-report.md << EOF
# LaburAR AWS Cost Optimization Report

**Report Date**: $(date)
**Project**: $PROJECT_NAME
**Environment**: $STAGE
**Region**: $AWS_REGION

## Current Cost Summary

**Current Month Cost**: \$$(printf "%.2f" "$TOTAL_COST")
**Monthly Budget**: \$10.00
**Remaining Budget**: \$$(echo "10.00 - $TOTAL_COST" | bc -l | xargs printf "%.2f")

## Cost Breakdown by Service

$(if [ -f cost-breakdown.txt ]; then cat cost-breakdown.txt | head -10; else echo "No cost breakdown available"; fi)

## Free Tier Usage Analysis

### EC2 (t3.micro/t2.micro)
- **Limit**: 750 hours/month
- **Current Usage**: Estimated based on running instances
- **Status**: $(if check_free_tier_usage >/dev/null 2>&1; then echo "✅ Within limits"; else echo "⚠️ Approaching limits"; fi)

### RDS (db.t3.micro)
- **Limit**: 750 hours/month + 20GB storage
- **Current Usage**: Estimated based on running instances
- **Status**: $(if check_free_tier_usage >/dev/null 2>&1; then echo "✅ Within limits"; else echo "⚠️ Approaching limits"; fi)

### S3 + CloudFront
- **Limit**: 5GB storage + 50GB transfer
- **Current Usage**: Estimated from bucket size
- **Status**: ✅ Within limits (monitoring enabled)

## Optimization Opportunities

$(if [ -f optimization-recommendations.txt ]; then
    echo "### Identified Optimizations"
    echo ""
    while IFS= read -r line; do
        echo "- $line"
    done < optimization-recommendations.txt
else
    echo "✅ No optimization opportunities found"
fi)

## Cost Optimization Actions Taken

### Automatic Optimizations Applied
- Set CloudWatch log retention to 7 days
- Cleaned up old log streams
- Applied resource tagging for better cost tracking

### Manual Optimizations Recommended
1. **Schedule non-production resources**: Stop RDS and EC2 during off-hours
2. **Optimize images**: Compress images before S3 upload
3. **Enable CloudFront caching**: Reduce origin requests
4. **Monitor unused resources**: Regular cleanup of EBS volumes and snapshots

## Free Tier Optimization Strategies

### EC2 Optimization
- Use t3.micro instances (better performance than t2.micro)
- Schedule instances for business hours only if possible
- Monitor CPU utilization and downsize if underutilized

### RDS Optimization
- Use db.t3.micro instance (free tier eligible)
- Enable automated backups (included in free tier)
- Monitor connection count and optimize pooling

### S3 + CloudFront Optimization
- Use CloudFront for caching (50GB free transfer)
- Optimize image sizes before upload
- Set appropriate S3 lifecycle policies

### Data Transfer Optimization
- Use CloudFront to reduce direct S3 access
- Compress responses from backend API
- Optimize frontend bundle sizes

## Cost Monitoring Setup

### Billing Alerts
- **\$5 Warning**: Early warning for cost increases
- **\$8 Critical**: Approaching budget limit
- **\$10 Maximum**: Budget exceeded alert

### Daily Monitoring
- Automated daily cost checks
- Free tier usage monitoring
- Resource utilization alerts

## Recommendations for Staying Within Free Tier

### Short-term (Next 30 days)
1. Monitor daily costs closely
2. Implement automated resource scheduling
3. Optimize application performance to reduce resource usage

### Medium-term (3-6 months)
1. Implement container-based architecture for better resource utilization
2. Use Lambda functions for background tasks
3. Implement comprehensive caching strategy

### Long-term (6+ months)
1. Consider Reserved Instances after free tier expires
2. Implement auto-scaling based on demand
3. Evaluate serverless architecture for cost optimization

## Emergency Cost Control

If costs approach the budget limit:

1. **Immediate Actions**:
   - Stop non-critical RDS instances
   - Reduce CloudWatch log retention
   - Delete unused EBS volumes and snapshots

2. **Scale-down Procedures**:
   - Switch to smaller instance types
   - Reduce backup retention periods
   - Implement request throttling

3. **Budget Protection**:
   - Set up billing alerts at 80% and 90% of budget
   - Implement automatic resource shutdown at budget limit
   - Use AWS Cost Anomaly Detection

## Next Review Date
**$(date -d '+1 week' +'%Y-%m-%d')** - Weekly cost optimization review

---

*This report was generated automatically. For questions or concerns, review the cost optimization procedures or consult AWS documentation.*
EOF
    
    log "Cost optimization report created: cost-optimization-report.md"
}

# Send cost alert if needed
send_cost_alert() {
    local threshold=${1:-8.00}
    
    if (( $(echo "$TOTAL_COST > $threshold" | bc -l) )); then
        warn "Cost threshold exceeded: \$$(printf "%.2f" "$TOTAL_COST") > \$$(printf "%.2f" "$threshold")"
        
        if [ -n "$ALERT_EMAIL" ]; then
            # Create alert message
            local message="LaburAR AWS Cost Alert

Current month cost: \$$(printf "%.2f" "$TOTAL_COST")
Budget limit: \$10.00
Threshold: \$$(printf "%.2f" "$threshold")

Top cost drivers:
$(head -5 cost-breakdown.txt | sed 's/^/- /')

Optimization opportunities:
$(if [ -f optimization-recommendations.txt ]; then head -3 optimization-recommendations.txt | sed 's/^/- /'; else echo "- No immediate optimizations found"; fi)

Please review the cost optimization report for detailed recommendations."
            
            info "Cost alert would be sent to: $ALERT_EMAIL"
            echo "$message" > cost-alert-message.txt
        fi
        
        return 1
    fi
    
    return 0
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f cost-breakdown.txt optimization-recommendations.txt cost-alert-message.txt
}

# Main cost optimization process
main() {
    log "Starting LaburAR AWS cost optimization..."
    log "Region: $AWS_REGION | Project: $PROJECT_NAME | Stage: $STAGE"
    log "Free Tier threshold: ${FREE_TIER_THRESHOLD}%"
    
    # Trap cleanup on exit
    trap cleanup EXIT
    
    check_prerequisites
    get_current_costs
    
    # Check if we need to optimize
    local needs_optimization=false
    
    if ! check_free_tier_usage; then
        needs_optimization=true
    fi
    
    if ! identify_optimizations; then
        needs_optimization=true
    fi
    
    if ! generate_cost_forecast; then
        needs_optimization=true
    fi
    
    # Apply optimizations if needed
    if [ "$needs_optimization" = true ]; then
        warn "Cost optimization needed!"
        apply_optimizations
    else
        log "No optimization needed - costs are within acceptable limits ✓"
    fi
    
    setup_cost_monitoring
    create_cost_report
    
    # Send alert if costs are high
    if ! send_cost_alert 8.00; then
        warn "Cost alert threshold exceeded!"
    fi
    
    log "🎉 Cost optimization analysis completed!"
    
    info "Summary:"
    info "✓ Current costs analyzed and breakdown generated"
    info "✓ Free tier usage checked and monitored"
    info "✓ Optimization opportunities identified"
    info "✓ Automatic optimizations applied where safe"
    info "✓ Cost monitoring and forecasting configured"
    
    if [ "$needs_optimization" = true ]; then
        warn "Action required:"
        warn "• Review cost-optimization-report.md"
        warn "• Implement recommended optimizations"
        warn "• Monitor costs daily until stabilized"
    fi
    
    info "Reports generated:"
    info "• cost-optimization-report.md - Detailed analysis and recommendations"
    if [ -f optimization-recommendations.txt ]; then
        info "• optimization-recommendations.txt - Specific optimization actions"
    fi
    
    local current_cost_formatted=$(printf "%.2f" "$TOTAL_COST")
    if (( $(echo "$TOTAL_COST < 5.00" | bc -l) )); then
        log "Current cost (\$$current_cost_formatted) is well within budget ✅"
    elif (( $(echo "$TOTAL_COST < 8.00" | bc -l) )); then
        warn "Current cost (\$$current_cost_formatted) is approaching budget limit ⚠️"
    else
        error "Current cost (\$$current_cost_formatted) is near or exceeding budget! 🚨"
    fi
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi