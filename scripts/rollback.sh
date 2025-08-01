#!/bin/bash

# LABUREMOS - Rollback Script
# Handles automatic rollback to previous deployment with health validation
# Usage: ./rollback.sh [staging|production] [--target=DEPLOYMENT_ID]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="laburemos"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/../rollback.log"
ROLLBACK_ID=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="${SCRIPT_DIR}/../backups"

# AWS Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="529496937346"
CLOUDFRONT_DISTRIBUTION_ID="E1E1QZ7YLALIAZ"

# Default values
ENVIRONMENT=""
TARGET_DEPLOYMENT=""
FORCE_ROLLBACK=false

# Log function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)  echo -e "${GREEN}[INFO]${NC} $message" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} $message" ;;
        DEBUG) echo -e "${BLUE}[DEBUG]${NC} $message" ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Error handler
error_exit() {
    log ERROR "$1"
    exit 1
}

# Find available backups
find_available_backups() {
    log INFO "Searching for available backups..."
    
    if [ ! -d "$BACKUP_DIR" ]; then
        error_exit "Backup directory not found: $BACKUP_DIR"
    fi
    
    local backups=($(find "$BACKUP_DIR" -maxdepth 1 -type d -name "20*" | sort -r))
    
    if [ ${#backups[@]} -eq 0 ]; then
        error_exit "No backups found in $BACKUP_DIR"
    fi
    
    log INFO "Found ${#backups[@]} available backups:"
    for i in "${!backups[@]}"; do
        local backup_dir="${backups[$i]}"
        local deployment_id=$(basename "$backup_dir")
        local backup_info_file="$backup_dir/deployment-info.json"
        
        if [ -f "$backup_info_file" ]; then
            local git_commit=$(jq -r '.git_commit // "unknown"' "$backup_info_file")
            local timestamp=$(jq -r '.timestamp // "unknown"' "$backup_info_file")
            log INFO "  $((i+1)). $deployment_id (commit: ${git_commit:0:8}, time: $timestamp)"
        else
            log INFO "  $((i+1)). $deployment_id (no metadata available)"
        fi
    done
    
    # Select target backup
    if [ -z "$TARGET_DEPLOYMENT" ]; then
        TARGET_DEPLOYMENT=$(basename "${backups[0]}")
        log INFO "Using most recent backup: $TARGET_DEPLOYMENT"
    else
        # Validate target deployment exists
        if [ ! -d "$BACKUP_DIR/$TARGET_DEPLOYMENT" ]; then
            error_exit "Target deployment backup not found: $TARGET_DEPLOYMENT"
        fi
        log INFO "Using specified backup: $TARGET_DEPLOYMENT"
    fi
}

# Validate rollback target
validate_rollback_target() {
    log INFO "Validating rollback target: $TARGET_DEPLOYMENT"
    
    local target_dir="$BACKUP_DIR/$TARGET_DEPLOYMENT"
    local required_files=("deployment-info.json")
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$target_dir/$file" ]; then
            log WARN "Missing backup file: $file"
        fi
    done
    
    # Check if backup contains necessary configuration
    if [ -f "$target_dir/deployment-info.json" ]; then
        local backup_env=$(jq -r '.environment // "unknown"' "$target_dir/deployment-info.json")
        if [ "$backup_env" != "$ENVIRONMENT" ]; then
            log WARN "Backup environment ($backup_env) doesn't match target environment ($ENVIRONMENT)"
            if [ "$FORCE_ROLLBACK" != true ]; then
                error_exit "Environment mismatch. Use --force to override."
            fi
        fi
    fi
    
    log INFO "Rollback target validation completed"
}

# Rollback ECS service
rollback_ecs_service() {
    log INFO "Rolling back ECS service..."
    
    local cluster_name="laburemos-${ENVIRONMENT}"
    local service_name="laburemos-backend-${ENVIRONMENT}"
    local target_dir="$BACKUP_DIR/$TARGET_DEPLOYMENT"
    
    # Check if ECS service backup exists
    if [ ! -f "$target_dir/ecs-service-config.json" ]; then
        log WARN "ECS service backup not found, skipping ECS rollback"
        return 0
    fi
    
    # Get previous task definition ARN
    local previous_task_def
    previous_task_def=$(jq -r '.services[0].taskDefinition' "$target_dir/ecs-service-config.json")
    
    if [ "$previous_task_def" = "null" ] || [ -z "$previous_task_def" ]; then
        log WARN "No valid task definition found in backup"
        return 0
    fi
    
    log INFO "Rolling back to task definition: $previous_task_def"
    
    # Update ECS service
    aws ecs update-service \
        --cluster "$cluster_name" \
        --service "$service_name" \
        --task-definition "$previous_task_def" \
        --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100" || error_exit "ECS rollback failed"
    
    # Wait for deployment to stabilize
    log INFO "Waiting for ECS service to stabilize..."
    aws ecs wait services-stable \
        --cluster "$cluster_name" \
        --services "$service_name" || error_exit "ECS rollback stabilization failed"
    
    log INFO "ECS service rollback completed"
}

# Rollback CloudFront (if needed)
rollback_cloudfront() {
    log INFO "Checking CloudFront rollback requirements..."
    
    local target_dir="$BACKUP_DIR/$TARGET_DEPLOYMENT"
    
    # Check if CloudFront backup exists
    if [ ! -f "$target_dir/cloudfront-config.json" ]; then
        log INFO "No CloudFront backup found, skipping CloudFront rollback"
        return 0
    fi
    
    # Note: CloudFront rollbacks are typically not necessary for most deployments
    # as the frontend is statically served and cache invalidation handles updates
    log INFO "CloudFront configuration backup exists but rollback not implemented"
    log INFO "Consider manual CloudFront configuration if needed"
    
    # Create cache invalidation to ensure fresh content
    log INFO "Creating CloudFront cache invalidation..."
    local invalidation_id
    invalidation_id=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    log INFO "CloudFront invalidation created: $invalidation_id"
}

# Rollback database (if needed and safe)
rollback_database() {
    log INFO "Checking database rollback requirements..."
    
    local target_dir="$BACKUP_DIR/$TARGET_DEPLOYMENT"
    
    # Database rollbacks are dangerous and should be handled carefully
    # For now, we'll just log and skip automatic database rollback
    log WARN "Database rollback not implemented for safety reasons"
    log WARN "If database rollback is needed, please perform manually with proper backups"
    
    # Check if database backup exists
    if [ -f "$target_dir/database-backup.sql" ]; then
        log INFO "Database backup found but not applied automatically"
        log INFO "Backup location: $target_dir/database-backup.sql"
    fi
}

# Rollback S3 frontend (if backup exists)
rollback_s3_frontend() {
    log INFO "Checking S3 frontend rollback..."
    
    local target_dir="$BACKUP_DIR/$TARGET_DEPLOYMENT"
    local s3_bucket
    
    if [ "$ENVIRONMENT" = "production" ]; then
        s3_bucket="laburemos-frontend-production"
    else
        s3_bucket="laburemos-frontend-staging"
    fi
    
    # Check if frontend backup exists
    if [ ! -d "$target_dir/frontend-backup" ]; then
        log INFO "No frontend backup found, skipping S3 rollback"
        return 0
    fi
    
    log INFO "Rolling back frontend to S3 bucket: $s3_bucket"
    
    # Sync backup to S3
    aws s3 sync "$target_dir/frontend-backup" "s3://${s3_bucket}/" \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "*.html" \
        --exclude "service-worker.js" || error_exit "S3 frontend rollback failed"
    
    # Upload HTML files with no-cache
    aws s3 sync "$target_dir/frontend-backup" "s3://${s3_bucket}/" \
        --cache-control "public, max-age=0, must-revalidate" \
        --include "*.html" \
        --include "service-worker.js" || error_exit "S3 HTML rollback failed"
    
    log INFO "S3 frontend rollback completed"
}

# Health check after rollback
run_post_rollback_health_check() {
    log INFO "Running post-rollback health checks..."
    
    local frontend_url
    local backend_url
    
    if [ "$ENVIRONMENT" = "production" ]; then
        frontend_url="https://laburemos.com.ar"
        backend_url="http://3.81.56.168:3001"
    else
        frontend_url="https://staging.laburemos.com.ar"
        backend_url="http://staging-backend.laburemos.com.ar"
    fi
    
    # Wait for services to stabilize
    log INFO "Waiting for services to stabilize..."
    sleep 60
    
    # Check frontend
    log INFO "Checking frontend health: $frontend_url"
    local frontend_status
    frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$frontend_url" || echo "000")
    
    if [ "$frontend_status" != "200" ]; then
        error_exit "Frontend health check failed after rollback. Status: $frontend_status"
    fi
    
    # Check backend
    log INFO "Checking backend health: ${backend_url}/health"
    local backend_status
    backend_status=$(curl -s -o /dev/null -w "%{http_code}" "${backend_url}/health" || echo "000")
    
    if [ "$backend_status" != "200" ]; then
        error_exit "Backend health check failed after rollback. Status: $backend_status"
    fi
    
    # Extended functional tests
    log INFO "Running extended functional tests..."
    local test_endpoints=("/health" "/api/categories")
    for endpoint in "${test_endpoints[@]}"; do
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" "${backend_url}${endpoint}" || echo "000")
        if [[ "$status" =~ ^[45] ]]; then
            log WARN "API endpoint $endpoint returned status: $status after rollback"
        fi
    done
    
    log INFO "Post-rollback health checks completed successfully"
}

# Send notification
send_rollback_notification() {
    local status=$1
    local message=$2
    
    log INFO "Sending rollback notification: $status - $message"
    
    # Create detailed rollback report
    local report="LABUREMOS Rollback Report\n"
    report+="========================\n"
    report+="Environment: $ENVIRONMENT\n"
    report+="Target Deployment: $TARGET_DEPLOYMENT\n"
    report+="Rollback ID: $ROLLBACK_ID\n"
    report+="Status: $status\n"
    report+="Timestamp: $(date)\n"
    report+="Executed by: $(whoami) on $(hostname)\n"
    
    if [ "$status" = "success" ]; then
        log INFO "🎉 ROLLBACK SUCCESS: $message"
        echo -e "$report"
    else
        log ERROR "💥 ROLLBACK FAILED: $message"
        echo -e "$report"
    fi
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            staging|production)
                ENVIRONMENT="$1"
                shift
                ;;
            --target=*)
                TARGET_DEPLOYMENT="${1#*=}"
                shift
                ;;
            --force)
                FORCE_ROLLBACK=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                error_exit "Unknown option: $1"
                ;;
        esac
    done
    
    if [ -z "$ENVIRONMENT" ]; then
        error_exit "Environment must be specified (staging|production)"
    fi
}

# Show help
show_help() {
    cat << EOF
LABUREMOS Rollback Script

Usage: $0 <environment> [options]

Environments:
  staging     Rollback staging environment
  production  Rollback production environment

Options:
  --target=ID      Rollback to specific deployment ID
  --force          Force rollback even if validations fail
  --help, -h       Show this help message

Examples:
  $0 staging                           # Rollback to most recent backup
  $0 production --target=20240131-143022  # Rollback to specific deployment
  $0 staging --force                   # Force rollback

EOF
}

# Main rollback function
main() {
    log INFO "Starting LABUREMOS rollback - ID: $ROLLBACK_ID"
    log INFO "Environment: $ENVIRONMENT"
    log INFO "Target deployment: $TARGET_DEPLOYMENT"
    
    # Find and validate backups
    find_available_backups
    validate_rollback_target
    
    # Confirm rollback (if not in CI/CD environment)
    if [ -t 0 ] && [ "$FORCE_ROLLBACK" != true ]; then
        echo -e "${YELLOW}WARNING: You are about to rollback $ENVIRONMENT to deployment $TARGET_DEPLOYMENT${NC}"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
            log INFO "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    # Perform rollback steps
    log INFO "Starting rollback process..."
    
    # Rollback ECS service (backend)
    rollback_ecs_service
    
    # Rollback S3 frontend (if backup exists)
    rollback_s3_frontend
    
    # Handle CloudFront
    rollback_cloudfront
    
    # Database rollback (warning only for safety)
    rollback_database
    
    # Verification
    run_post_rollback_health_check
    
    # Success notification
    send_rollback_notification "success" "Rollback completed successfully to deployment $TARGET_DEPLOYMENT"
    
    log INFO "🔄 Rollback completed successfully!"
    log INFO "Environment: $ENVIRONMENT"
    log INFO "Rolled back to: $TARGET_DEPLOYMENT"
    log INFO "Rollback ID: $ROLLBACK_ID"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Initialize log file
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "=== LABUREMOS Rollback Log - $(date) ===" >> "$LOG_FILE"
    
    # Parse arguments and run main function
    parse_arguments "$@"
    main
fi