#!/bin/bash

# LaburAR Deployment Script for Oracle Cloud Infrastructure
# Automated deployment from local Windows to OCI ARM instance
# Usage: ./deploy-to-oci.sh [staging|production]

set -e

# Configuration
ENVIRONMENT=${1:-staging}
LOCAL_PROJECT_PATH="C:/xampp/htdocs/Laburar"
OCI_USER="ubuntu"
OCI_HOST=""  # Set your OCI instance IP
OCI_PATH="/opt/laburar"
SSH_KEY_PATH="$HOME/.ssh/laburar-oci"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}========== $1 ==========${NC}\n"
}

# Check prerequisites
check_prerequisites() {
    print_header "Prerequisites Check"
    
    # Check if OCI_HOST is set
    if [ -z "$OCI_HOST" ]; then
        print_error "OCI_HOST is not set. Please set your OCI instance IP address."
        exit 1
    fi
    
    # Check if SSH key exists
    if [ ! -f "$SSH_KEY_PATH" ]; then
        print_error "SSH key not found at $SSH_KEY_PATH"
        exit 1
    fi
    
    # Check if local project exists
    if [ ! -d "$LOCAL_PROJECT_PATH" ]; then
        print_error "Local project not found at $LOCAL_PROJECT_PATH"
        exit 1
    fi
    
    # Test SSH connection
    print_status "Testing SSH connection to OCI instance..."
    ssh -i "$SSH_KEY_PATH" -o ConnectTimeout=10 -o BatchMode=yes "$OCI_USER@$OCI_HOST" "echo 'SSH connection successful'" || {
        print_error "SSH connection failed"
        exit 1
    }
    
    print_status "Prerequisites check passed"
}

# Pre-deployment tests
run_local_tests() {
    print_header "Local Tests"
    
    print_status "Running backend tests..."
    cd "$LOCAL_PROJECT_PATH/backend"
    npm test || {
        print_error "Backend tests failed"
        exit 1
    }
    
    print_status "Building backend..."
    npm run build || {
        print_error "Backend build failed"
        exit 1
    }
    
    print_status "Running frontend tests..."
    cd "$LOCAL_PROJECT_PATH/frontend"
    npm test || {
        print_error "Frontend tests failed"
        exit 1
    }
    
    print_status "Building frontend..."
    npm run build || {
        print_error "Frontend build failed"
        exit 1
    }
    
    print_status "Local tests passed"
}

# Create deployment package
create_deployment_package() {
    print_header "Creating Deployment Package"
    
    local temp_dir=$(mktemp -d)
    local package_name="laburar-deployment-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    print_status "Creating temporary deployment package..."
    
    # Copy source code excluding unnecessary files
    rsync -av \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='logs' \
        --exclude='dist' \
        --exclude='.next' \
        --exclude='coverage' \
        --exclude='*.log' \
        "$LOCAL_PROJECT_PATH/" "$temp_dir/laburar/"
    
    # Create deployment archive
    cd "$temp_dir"
    tar -czf "$package_name" laburar/
    
    # Move to desktop for easy access
    mv "$package_name" "$HOME/Desktop/"
    echo "$HOME/Desktop/$package_name" > /tmp/deployment_package_path
    
    # Cleanup
    rm -rf "$temp_dir"
    
    print_status "Deployment package created: $HOME/Desktop/$package_name"
}

# Upload and extract deployment package
upload_deployment() {
    print_header "Uploading Deployment Package"
    
    local package_path=$(cat /tmp/deployment_package_path)
    local package_name=$(basename "$package_path")
    
    print_status "Uploading deployment package to OCI..."
    scp -i "$SSH_KEY_PATH" "$package_path" "$OCI_USER@$OCI_HOST:/tmp/"
    
    print_status "Extracting deployment package on OCI..."
    ssh -i "$SSH_KEY_PATH" "$OCI_USER@$OCI_HOST" << EOF
        cd /tmp
        tar -xzf $package_name
        
        # Backup current deployment
        if [ -d "$OCI_PATH" ]; then
            sudo cp -r $OCI_PATH /opt/laburar-backup-\$(date +%Y%m%d-%H%M%S)
        fi
        
        # Copy new files
        sudo rsync -av --delete laburar/ $OCI_PATH/
        sudo chown -R ubuntu:ubuntu $OCI_PATH
        
        # Cleanup
        rm -rf laburar/ $package_name
EOF
    
    print_status "Deployment package uploaded and extracted"
}

# Configure environment
configure_environment() {
    print_header "Environment Configuration"
    
    print_status "Configuring environment for $ENVIRONMENT..."
    
    ssh -i "$SSH_KEY_PATH" "$OCI_USER@$OCI_HOST" << EOF
        cd $OCI_PATH
        
        # Backend environment
        if [ ! -f backend/.env ]; then
            cp backend/.env.template backend/.env
            echo "Please configure backend/.env with your settings"
        fi
        
        # Frontend environment
        if [ ! -f frontend/.env.local ]; then
            cp frontend/.env.local.template frontend/.env.local
            echo "Please configure frontend/.env.local with your settings"
        fi
        
        # Set environment-specific configurations
        if [ "$ENVIRONMENT" = "production" ]; then
            sed -i 's/NODE_ENV=.*/NODE_ENV=production/' backend/.env
            sed -i 's/NODE_ENV=.*/NODE_ENV=production/' frontend/.env.local
        else
            sed -i 's/NODE_ENV=.*/NODE_ENV=staging/' backend/.env
            sed -i 's/NODE_ENV=.*/NODE_ENV=staging/' frontend/.env.local
        fi
EOF
    
    print_status "Environment configured for $ENVIRONMENT"
}

# Install dependencies and build
build_application() {
    print_header "Building Application"
    
    print_status "Installing dependencies and building application..."
    
    ssh -i "$SSH_KEY_PATH" "$OCI_USER@$OCI_HOST" << EOF
        cd $OCI_PATH
        
        # Backend build
        print_status "Building backend..."
        cd backend
        npm ci --production=false
        npm run db:generate
        npm run build
        
        # Frontend build
        print_status "Building frontend..."
        cd ../frontend
        npm ci --production=false
        npm run build
        
        print_status "Application built successfully"
EOF
}

# Database operations
manage_database() {
    print_header "Database Management"
    
    print_status "Running database migrations..."
    
    ssh -i "$SSH_KEY_PATH" "$OCI_USER@$OCI_HOST" << EOF
        cd $OCI_PATH/backend
        
        # Test database connection
        npm run test:db || {
            echo "Database connection failed. Please check your database configuration."
            exit 1
        }
        
        # Run migrations
        npm run db:migrate
        
        # Seed data if needed
        if [ "$ENVIRONMENT" = "staging" ]; then
            npm run db:seed
        fi
        
        print_status "Database operations completed"
EOF
}

# Deploy application with PM2
deploy_with_pm2() {
    print_header "PM2 Deployment"
    
    print_status "Deploying with PM2..."
    
    ssh -i "$SSH_KEY_PATH" "$OCI_USER@$OCI_HOST" << EOF
        cd $OCI_PATH
        
        # Stop current applications if running
        pm2 stop ecosystem.config.js || true
        
        # Start applications
        pm2 start ecosystem.config.js
        
        # Save PM2 configuration
        pm2 save
        
        print_status "PM2 deployment completed"
EOF
}

# Health checks
run_health_checks() {
    print_header "Health Checks"
    
    print_status "Running post-deployment health checks..."
    
    ssh -i "$SSH_KEY_PATH" "$OCI_USER@$OCI_HOST" << EOF
        cd $OCI_PATH
        
        # Wait for services to start
        sleep 15
        
        # Check frontend
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Frontend health check passed"
        else
            echo "❌ Frontend health check failed"
            exit 1
        fi
        
        # Check backend
        if curl -f http://localhost:3001/health > /dev/null 2>&1; then
            echo "✅ Backend health check passed"
        else
            echo "❌ Backend health check failed"
            exit 1
        fi
        
        # Check PM2 status
        pm2 status
        
        echo "🎉 All health checks passed!"
EOF
    
    print_status "Health checks completed successfully"
}

# Rollback function
rollback_deployment() {
    print_header "Rolling Back Deployment"
    
    print_warning "Rolling back to previous deployment..."
    
    ssh -i "$SSH_KEY_PATH" "$OCI_USER@$OCI_HOST" << EOF
        # Find latest backup
        latest_backup=\$(ls -t /opt/laburar-backup-* | head -n1)
        
        if [ -n "\$latest_backup" ]; then
            print_status "Rolling back to \$latest_backup"
            
            # Stop current services
            pm2 stop ecosystem.config.js || true
            
            # Restore backup
            sudo rm -rf $OCI_PATH
            sudo mv "\$latest_backup" $OCI_PATH
            sudo chown -R ubuntu:ubuntu $OCI_PATH
            
            # Restart services
            cd $OCI_PATH
            pm2 start ecosystem.config.js
            
            print_status "Rollback completed"
        else
            print_error "No backup found for rollback"
            exit 1
        fi
EOF
}

# Cleanup
cleanup() {
    print_header "Cleanup"
    
    print_status "Cleaning up temporary files..."
    
    # Remove local deployment package
    local package_path=$(cat /tmp/deployment_package_path 2>/dev/null || echo "")
    if [ -n "$package_path" ] && [ -f "$package_path" ]; then
        rm "$package_path"
    fi
    
    # Remove temp files
    rm -f /tmp/deployment_package_path
    
    # Clean up old backups on OCI (keep last 5)
    ssh -i "$SSH_KEY_PATH" "$OCI_USER@$OCI_HOST" << EOF
        ls -t /opt/laburar-backup-* | tail -n +6 | xargs sudo rm -rf || true
EOF
    
    print_status "Cleanup completed"
}

# Main deployment flow
main() {
    print_header "LaburAR Deployment to OCI ($ENVIRONMENT)"
    
    # Trap errors and cleanup
    trap 'print_error "Deployment failed! Check the logs above."; cleanup; exit 1' ERR
    
    check_prerequisites
    run_local_tests
    create_deployment_package
    upload_deployment
    configure_environment
    build_application
    manage_database
    deploy_with_pm2
    
    # Run health checks with rollback on failure
    if ! run_health_checks; then
        print_error "Health checks failed. Initiating rollback..."
        rollback_deployment
        exit 1
    fi
    
    cleanup
    
    print_header "Deployment Successful!"
    print_status "LaburAR has been successfully deployed to OCI ($ENVIRONMENT)"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "🌐 Production URL: https://your-domain.com"
        print_status "📚 API Docs: https://your-domain.com/api/docs"
    else
        print_status "🧪 Staging URL: http://$OCI_HOST:3000"
        print_status "📚 API Docs: http://$OCI_HOST:3001/docs"
    fi
    
    print_status "🎉 Deployment completed at $(date)"
}

# Show usage
usage() {
    echo "Usage: $0 [staging|production]"
    echo ""
    echo "Examples:"
    echo "  $0 staging     # Deploy to staging environment"
    echo "  $0 production  # Deploy to production environment"
    echo ""
    echo "Prerequisites:"
    echo "  - Set OCI_HOST variable in this script"
    echo "  - SSH key available at $SSH_KEY_PATH"
    echo "  - Local project at $LOCAL_PROJECT_PATH"
    exit 1
}

# Check arguments
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
fi

if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_error "Invalid environment: $ENVIRONMENT"
    usage
fi

# Run main deployment
main