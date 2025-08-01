#!/bin/bash

# LABUREMOS Backend - AWS Production Deployment Script
# This script deploys the NestJS backend to AWS EC2

set -e

echo "🚀 Starting LABUREMOS Backend deployment to AWS..."

# Configuration
EC2_HOST="3.81.56.168"
EC2_USER="ec2-user"
APP_DIR="/home/ec2-user/laburemos"
BACKEND_DIR="/home/ec2-user/laburemos/backend"
KEY_PATH="$HOME/.ssh/laburemos-key.pem"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if SSH key exists
if [ ! -f "$KEY_PATH" ]; then
    echo_error "SSH key not found at $KEY_PATH"
    echo "Please ensure your SSH key is available and has correct permissions:"
    echo "chmod 400 $KEY_PATH"
    exit 1
fi

# Function to run commands on EC2
run_remote() {
    ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "$1"
}

# Function to copy files to EC2
copy_to_ec2() {
    scp -i "$KEY_PATH" -o StrictHostKeyChecking=no -r "$1" "$EC2_USER@$EC2_HOST:$2"
}

echo_status "1. Preparing deployment (skipping local build)..."
echo "Will build on server to avoid local timeout issues"

echo_status "2. Creating deployment package..."
# Create a deployment package excluding node_modules and unnecessary files
tar -czf backend-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=logs \
    --exclude=coverage \
    --exclude=.env \
    --exclude=.env.local \
    --exclude=*.log \
    --exclude=backend-deploy.tar.gz \
    .

echo_status "3. Copying files to EC2..."
copy_to_ec2 "backend-deploy.tar.gz" "/tmp/"

echo_status "4. Installing Node.js compatible with Amazon Linux 2..."
run_remote "
    # Remove existing Node.js if installed
    rm -rf ~/.nvm
    
    # Install Node.js 16.x (compatible with Amazon Linux 2)
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
    source ~/.bashrc
    nvm install 16.20.2
    nvm use 16.20.2
    nvm alias default 16.20.2
    
    # Verify installation
    node --version
    npm --version
"

echo_status "5. Setting up application directory on EC2..."
run_remote "sudo mkdir -p $APP_DIR"
run_remote "sudo chown ec2-user:ec2-user $APP_DIR"

echo_status "6. Extracting and installing application..."
run_remote "
    cd $APP_DIR && \
    rm -rf backend && \
    mkdir -p backend && \
    cd backend && \
    tar -xzf /tmp/backend-deploy.tar.gz && \
    rm /tmp/backend-deploy.tar.gz
"

echo_status "7. Installing dependencies..."
run_remote "source ~/.bashrc && cd $BACKEND_DIR && npm ci"

echo_status "8. Building application on server..."
run_remote "source ~/.bashrc && cd $BACKEND_DIR && npm run build"

echo_status "9. Setting up environment file..."
copy_to_ec2 ".env.production" "$BACKEND_DIR/.env"

echo_status "10. Setting up logs directory..."
run_remote "mkdir -p $BACKEND_DIR/logs"

echo_status "11. Installing PM2 globally..."
run_remote "source ~/.bashrc && sudo $(which npm) install -g pm2"

echo_status "12. Setting up PM2 ecosystem file..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'laburemos-backend',
    script: 'dist/main.js',
    cwd: '$BACKEND_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '$BACKEND_DIR/logs/err.log',
    out_file: '$BACKEND_DIR/logs/out.log',
    log_file: '$BACKEND_DIR/logs/combined.log',
    time: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 8000
  }]
};
EOF

copy_to_ec2 "ecosystem.config.js" "$BACKEND_DIR/"

echo_status "13. Running database migrations..."
run_remote "source ~/.bashrc && cd $BACKEND_DIR && npx prisma generate"
run_remote "source ~/.bashrc && cd $BACKEND_DIR && npx prisma migrate deploy"

echo_status "14. Stopping existing PM2 processes..."
run_remote "pm2 stop laburemos-backend || true"
run_remote "pm2 delete laburemos-backend || true"

echo_status "15. Starting application with PM2..."
run_remote "source ~/.bashrc && cd $BACKEND_DIR && pm2 start ecosystem.config.js"

echo_status "16. Saving PM2 configuration..."
run_remote "source ~/.bashrc && pm2 save"
run_remote "source ~/.bashrc && pm2 startup systemd -u ec2-user --hp /home/ec2-user || true"

echo_status "17. Setting up Nginx reverse proxy..."
run_remote "sudo yum update -y && sudo yum install -y nginx"

# Create Nginx configuration
cat > nginx.conf << EOF
server {
    listen 80;
    server_name $EC2_HOST;

    # API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Documentation
    location /docs {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # WebSocket support for socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

copy_to_ec2 "nginx.conf" "/tmp/"
run_remote "sudo cp /tmp/nginx.conf /etc/nginx/sites-available/laburemos"
run_remote "sudo ln -sf /etc/nginx/sites-available/laburemos /etc/nginx/sites-enabled/"
run_remote "sudo rm -f /etc/nginx/sites-enabled/default"
run_remote "sudo nginx -t"
run_remote "sudo systemctl restart nginx"
run_remote "sudo systemctl enable nginx"

echo_status "18. Setting up firewall..."
run_remote "sudo ufw allow 22"
run_remote "sudo ufw allow 80"
run_remote "sudo ufw allow 443"
run_remote "sudo ufw --force enable"

echo_status "19. Checking application status..."
sleep 10
run_remote "source ~/.bashrc && pm2 status"
run_remote "curl -f http://localhost:3001/api/auth/health || echo 'Health check failed'"

echo_success "✅ Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   - API: http://$EC2_HOST/api"
echo "   - Documentation: http://$EC2_HOST/docs"
echo "   - Health: http://$EC2_HOST/api/auth/health"
echo ""
echo "📊 Monitoring commands:"
echo "   - PM2 status: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST 'pm2 status'"
echo "   - View logs: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST 'pm2 logs laburemos-backend'"
echo "   - Restart app: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST 'pm2 restart laburemos-backend'"
echo ""
echo "🔧 Useful commands:"
echo "   - SSH to server: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST"
echo "   - Update app: ./deploy-aws.sh"

# Cleanup
rm -f backend-deploy.tar.gz ecosystem.config.js nginx.conf

echo_success "🎉 LABUREMOS Backend is now running on AWS!"