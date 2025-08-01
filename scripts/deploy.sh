#!/bin/bash

# LaburAR Deployment Script
# Supports multiple environments and rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Environment configurations
case "$ENVIRONMENT" in
    "staging")
        CLUSTER_NAME="laburar-staging"
        SERVICE_NAME="laburar-service-staging"
        DOMAIN="staging.laburar.com"
        MIN_HEALTHY_PERCENT=50
        MAX_PERCENT=200
        ;;
    "production")
        CLUSTER_NAME="laburar-production"
        SERVICE_NAME="laburar-service-production"
        DOMAIN="laburar.com"
        MIN_HEALTHY_PERCENT=100
        MAX_PERCENT=200
        ;;
    *)
        error "Invalid environment: $ENVIRONMENT. Use 'staging' or 'production'"
        ;;
esac

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks for $ENVIRONMENT..."
    
    # Check if required tools are installed
    command -v aws >/dev/null 2>&1 || error "AWS CLI not found"
    command -v docker >/dev/null 2>&1 || error "Docker not found"
    command -v jq >/dev/null 2>&1 || error "jq not found"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        error "AWS credentials not configured"
    fi
    
    # Check if cluster exists
    if ! aws ecs describe-clusters --clusters "$CLUSTER_NAME" >/dev/null 2>&1; then
        error "ECS cluster $CLUSTER_NAME not found"
    fi
    
    # Check if service exists
    if ! aws ecs describe-services --cluster "$CLUSTER_NAME" --services "$SERVICE_NAME" >/dev/null 2>&1; then
        error "ECS service $SERVICE_NAME not found"
    fi
    
    log "Pre-deployment checks passed"
}

# Build and push Docker images
build_and_push() {
    log "Building and pushing Docker images..."
    
    # Get current git commit
    GIT_COMMIT=$(git rev-parse --short HEAD)
    IMAGE_TAG="${VERSION}-${GIT_COMMIT}"
    
    # Frontend image
    log "Building frontend image..."
    docker build -f docker/frontend/Dockerfile -t "laburar-frontend:${IMAGE_TAG}" .
    
    # Backend image
    log "Building backend image..."
    docker build -f docker/backend/Dockerfile -t "laburar-backend:${IMAGE_TAG}" .
    
    # Tag and push to registry
    REGISTRY="ghcr.io/username"
    
    docker tag "laburar-frontend:${IMAGE_TAG}" "${REGISTRY}/laburar-frontend:${IMAGE_TAG}"
    docker tag "laburar-backend:${IMAGE_TAG}" "${REGISTRY}/laburar-backend:${IMAGE_TAG}"
    docker tag "laburar-frontend:${IMAGE_TAG}" "${REGISTRY}/laburar-frontend:latest"
    docker tag "laburar-backend:${IMAGE_TAG}" "${REGISTRY}/laburar-backend:latest"
    
    log "Pushing images to registry..."
    docker push "${REGISTRY}/laburar-frontend:${IMAGE_TAG}"
    docker push "${REGISTRY}/laburar-backend:${IMAGE_TAG}"
    docker push "${REGISTRY}/laburar-frontend:latest"
    docker push "${REGISTRY}/laburar-backend:latest"
    
    log "Images pushed successfully"
    echo "$IMAGE_TAG" > /tmp/deployment_tag
}

# Update ECS task definition
update_task_definition() {
    log "Updating ECS task definition..."
    
    IMAGE_TAG=$(cat /tmp/deployment_tag)
    REGISTRY="ghcr.io/username"
    
    # Get current task definition
    TASK_DEFINITION=$(aws ecs describe-task-definition \
        --task-definition "$SERVICE_NAME" \
        --query 'taskDefinition' \
        --output json)
    
    # Update image URIs
    NEW_TASK_DEFINITION=$(echo "$TASK_DEFINITION" | jq --arg IMAGE_TAG "$IMAGE_TAG" --arg REGISTRY "$REGISTRY" '
        .containerDefinitions[0].image = ($REGISTRY + "/laburar-frontend:" + $IMAGE_TAG) |
        .containerDefinitions[1].image = ($REGISTRY + "/laburar-backend:" + $IMAGE_TAG) |
        del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)
    ')
    
    # Register new task definition
    NEW_TASK_DEF_ARN=$(echo "$NEW_TASK_DEFINITION" | aws ecs register-task-definition \
        --cli-input-json file:///dev/stdin \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)
    
    log "New task definition registered: $NEW_TASK_DEF_ARN"
    echo "$NEW_TASK_DEF_ARN" > /tmp/new_task_definition
}

# Deploy to ECS
deploy_to_ecs() {
    log "Deploying to ECS..."
    
    NEW_TASK_DEF_ARN=$(cat /tmp/new_task_definition)
    
    # Get current service configuration
    CURRENT_SERVICE=$(aws ecs describe-services \
        --cluster "$CLUSTER_NAME" \
        --services "$SERVICE_NAME" \
        --query 'services[0]' \
        --output json)
    
    CURRENT_TASK_DEF=$(echo "$CURRENT_SERVICE" | jq -r '.taskDefinition')
    echo "$CURRENT_TASK_DEF" > /tmp/previous_task_definition
    
    # Update service with new task definition
    aws ecs update-service \
        --cluster "$CLUSTER_NAME" \
        --service "$SERVICE_NAME" \
        --task-definition "$NEW_TASK_DEF_ARN" \
        --deployment-configuration "minimumHealthyPercent=${MIN_HEALTHY_PERCENT},maximumPercent=${MAX_PERCENT}" \
        >/dev/null
    
    log "Service update initiated"
}

# Wait for deployment to complete
wait_for_deployment() {
    log "Waiting for deployment to complete..."
    
    TIMEOUT=1200  # 20 minutes
    ELAPSED=0
    
    while [ $ELAPSED -lt $TIMEOUT ]; do
        DEPLOYMENT_STATUS=$(aws ecs describe-services \
            --cluster "$CLUSTER_NAME" \
            --services "$SERVICE_NAME" \
            --query 'services[0].deployments[0].status' \
            --output text)
        
        RUNNING_COUNT=$(aws ecs describe-services \
            --cluster "$CLUSTER_NAME" \
            --services "$SERVICE_NAME" \
            --query 'services[0].runningCount' \
            --output text)
        
        DESIRED_COUNT=$(aws ecs describe-services \
            --cluster "$CLUSTER_NAME" \
            --services "$SERVICE_NAME" \
            --query 'services[0].desiredCount' \
            --output text)
        
        if [ "$DEPLOYMENT_STATUS" = "PRIMARY" ] && [ "$RUNNING_COUNT" -eq "$DESIRED_COUNT" ]; then
            log "Deployment completed successfully"
            return 0
        fi
        
        if [ "$DEPLOYMENT_STATUS" = "FAILED" ]; then
            error "Deployment failed"
        fi
        
        log "Deployment in progress... Status: $DEPLOYMENT_STATUS, Running: $RUNNING_COUNT/$DESIRED_COUNT"
        sleep 30
        ELAPSED=$((ELAPSED + 30))
    done
    
    error "Deployment timed out after $((TIMEOUT / 60)) minutes"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    RETRIES=10
    for i in $(seq 1 $RETRIES); do
        if curl -f "https://$DOMAIN/health" >/dev/null 2>&1; then
            log "Health check passed"
            return 0
        fi
        
        warn "Health check failed (attempt $i/$RETRIES)"
        sleep 30
    done
    
    error "Health check failed after $RETRIES attempts"
}

# Rollback deployment
rollback() {
    log "Rolling back deployment..."
    
    if [ ! -f /tmp/previous_task_definition ]; then
        error "No previous task definition found for rollback"
    fi
    
    PREVIOUS_TASK_DEF=$(cat /tmp/previous_task_definition)
    
    aws ecs update-service \
        --cluster "$CLUSTER_NAME" \
        --service "$SERVICE_NAME" \
        --task-definition "$PREVIOUS_TASK_DEF" \
        >/dev/null
    
    log "Rollback initiated"
    wait_for_deployment
    log "Rollback completed successfully"
}

# Cleanup
cleanup() {
    rm -f /tmp/deployment_tag /tmp/new_task_definition /tmp/previous_task_definition
}

# Main deployment flow
main() {
    log "Starting deployment to $ENVIRONMENT environment"
    
    trap cleanup EXIT
    
    case "${3:-deploy}" in
        "deploy")
            pre_deployment_checks
            build_and_push
            update_task_definition
            deploy_to_ecs
            wait_for_deployment
            
            if ! health_check; then
                warn "Health check failed, initiating rollback..."
                rollback
                exit 1
            fi
            
            log "🎉 Deployment to $ENVIRONMENT completed successfully!"
            log "Application is available at: https://$DOMAIN"
            ;;
        "rollback")
            log "Rolling back $ENVIRONMENT environment..."
            rollback
            log "🔄 Rollback completed successfully!"
            ;;
        "status")
            aws ecs describe-services \
                --cluster "$CLUSTER_NAME" \
                --services "$SERVICE_NAME" \
                --query 'services[0].[serviceName,status,runningCount,pendingCount,desiredCount]' \
                --output table
            ;;
        *)
            echo "Usage: $0 <environment> <version> [deploy|rollback|status]"
            echo "Examples:"
            echo "  $0 staging v1.2.3 deploy"
            echo "  $0 production latest rollback"
            echo "  $0 staging latest status"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"