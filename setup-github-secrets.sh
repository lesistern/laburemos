#!/bin/bash

# ========================================
# LABUREMOS - GitHub Secrets Setup Script
# ========================================
# Automatically configures all required GitHub secrets for CI/CD pipeline
# Usage: ./setup-github-secrets.sh <owner/repo>
# Example: ./setup-github-secrets.sh laburemos/platform
# ========================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $*${NC}"; }
log_success() { echo -e "${GREEN}✅ $*${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $*${NC}"; }
log_error() { echo -e "${RED}❌ $*${NC}"; }
log_header() { echo -e "${PURPLE}🚀 $*${NC}"; }

# Check if repository argument is provided
if [ $# -eq 0 ]; then
    log_error "Repository argument is required"
    echo "Usage: $0 <owner/repo>"
    echo "Example: $0 laburemos/platform"
    exit 1
fi

REPO=$1
log_header "Setting up GitHub Secrets for $REPO"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) is not installed. Please install it first:"
    echo "https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    log_error "Not authenticated with GitHub CLI. Please run: gh auth login"
    exit 1
fi

log_success "GitHub CLI is installed and authenticated"

# Function to set a secret
set_secret() {
    local name=$1
    local value=$2
    local description=$3
    
    echo "$value" | gh secret set "$name" --repo "$REPO"
    if [ $? -eq 0 ]; then
        log_success "Set secret: $name - $description"
    else
        log_error "Failed to set secret: $name"
        return 1
    fi
}

# Function to get user input
get_input() {
    local prompt=$1
    local secret_name=$2
    local default_value=${3:-""}
    
    if [ -n "$default_value" ]; then
        read -p "$prompt [$default_value]: " value
        echo "${value:-$default_value}"
    else
        read -p "$prompt: " value
        echo "$value"
    fi
}

# Function to get secret input (no echo)
get_secret_input() {
    local prompt=$1
    local secret_name=$2
    
    read -s -p "$prompt: " value
    echo
    echo "$value"
}

log_header "Gathering AWS Configuration"

# AWS Credentials
log_info "Enter your AWS credentials..."
AWS_ACCESS_KEY_ID=$(get_input "AWS Access Key ID" "AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=$(get_secret_input "AWS Secret Access Key" "AWS_SECRET_ACCESS_KEY")

# Verify AWS credentials
log_info "Verifying AWS credentials..."
if aws sts get-caller-identity --output text &> /dev/null; then
    log_success "AWS credentials are valid"
else
    log_error "AWS credentials are invalid. Please check and try again."
    exit 1
fi

log_header "Gathering Notification Configuration"

# Notification settings
NOTIFICATION_EMAIL=$(get_input "Notification email" "NOTIFICATION_EMAIL" "alerts@laburemos.com.ar")
EMERGENCY_EMAIL=$(get_input "Emergency notification email" "EMERGENCY_EMAIL" "$NOTIFICATION_EMAIL")
SLACK_WEBHOOK_URL=$(get_input "Slack webhook URL (optional)" "SLACK_WEBHOOK_URL")

# Email configuration for notifications
log_info "Email configuration for sending notifications..."
EMAIL_USERNAME=$(get_input "SMTP username (for sending emails)" "EMAIL_USERNAME")
EMAIL_PASSWORD=$(get_secret_input "SMTP password (for sending emails)" "EMAIL_PASSWORD")

log_header "Gathering SonarQube Configuration (Optional)"

# SonarQube (optional)
SONAR_TOKEN=$(get_input "SonarQube token (optional)" "SONAR_TOKEN")
SONAR_HOST_URL=$(get_input "SonarQube host URL (optional)" "SONAR_HOST_URL" "https://sonarcloud.io")

log_header "Setting GitHub Secrets"

# Set all secrets
log_info "Setting AWS secrets..."
set_secret "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID" "AWS Access Key for deployment"
set_secret "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY" "AWS Secret Key for deployment"

log_info "Setting notification secrets..."
set_secret "NOTIFICATION_EMAIL" "$NOTIFICATION_EMAIL" "Email for deployment notifications"
set_secret "EMERGENCY_EMAIL" "$EMERGENCY_EMAIL" "Email for emergency notifications"
set_secret "EMAIL_USERNAME" "$EMAIL_USERNAME" "SMTP username for sending emails"
set_secret "EMAIL_PASSWORD" "$EMAIL_PASSWORD" "SMTP password for sending emails"

if [ -n "$SLACK_WEBHOOK_URL" ]; then
    set_secret "SLACK_WEBHOOK_URL" "$SLACK_WEBHOOK_URL" "Slack webhook for notifications"
fi

if [ -n "$SONAR_TOKEN" ]; then
    log_info "Setting SonarQube secrets..."
    set_secret "SONAR_TOKEN" "$SONAR_TOKEN" "SonarQube authentication token"
    set_secret "SONAR_HOST_URL" "$SONAR_HOST_URL" "SonarQube host URL"
fi

# Set LABUREMOS-specific configuration
log_info "Setting LABUREMOS-specific configuration..."
set_secret "S3_BUCKET" "laburemos-files-2025" "S3 bucket for frontend deployment"
set_secret "CLOUDFRONT_DISTRIBUTION_ID" "E1E1QZ7YLALIAZ" "CloudFront distribution ID"
set_secret "EC2_INSTANCE_IP" "3.81.56.168" "EC2 instance IP for backend"
set_secret "RDS_ENDPOINT" "laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com" "RDS database endpoint"
set_secret "AWS_REGION" "us-east-1" "AWS region"
set_secret "CERTIFICATE_ARN" "arn:aws:acm:us-east-1:529496937346:certificate/94aa65d0-875b-4556-ae27-0c1f49f0b886" "ACM certificate ARN"

log_header "Creating GitHub Environments"

# Create environments with protection rules
log_info "Creating staging environment..."
gh api --method PUT "repos/$REPO/environments/staging" --field wait_timer=0 --field prevent_self_review=false

log_info "Creating production environment with protection rules..."
gh api --method PUT "repos/$REPO/environments/production" \
    --field wait_timer=300 \
    --field prevent_self_review=true \
    --field deployment_branch_policy='{"protected_branches":true,"custom_branch_policies":false}'

log_success "Environments created successfully"

log_header "Verifying Setup"

# Verify secrets are set
log_info "Verifying secrets are properly set..."
SECRETS=$(gh secret list --repo "$REPO" --json name --jq '.[].name' | wc -l)
log_success "$SECRETS secrets configured"

# List all configured secrets
log_info "Configured secrets:"
gh secret list --repo "$REPO" --json name,updatedAt --jq '.[] | "- " + .name + " (updated: " + .updatedAt + ")"'

log_header "Setup Complete!"

cat << EOF

🎉 GitHub Secrets Setup Complete!

✅ Configured secrets:
   - AWS credentials for deployment
   - Notification settings (email + Slack)
   - LABUREMOS-specific configuration
   - SonarQube integration (if provided)

✅ Created environments:
   - staging (immediate deployment)
   - production (5-minute delay + branch protection)

🚀 Your CI/CD pipeline is now ready!

Next steps:
1. Push your code to trigger the pipeline
2. Monitor deployments in GitHub Actions
3. Check CloudWatch for system monitoring
4. Configure additional Slack/email settings if needed

Repository: https://github.com/$REPO
Actions: https://github.com/$REPO/actions
Settings: https://github.com/$REPO/settings/secrets/actions

EOF

log_success "Setup completed successfully!"