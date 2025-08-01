#!/bin/bash
# Full Backend Deployment Script for LABUREMOS

# Variables
EC2_IP="3.81.56.168"
KEY_PATH="/tmp/laburemos-key.pem"
DB_ENDPOINT="laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
S3_BUCKET="laburemos-files-2025"

echo "=== LABUREMOS Backend Full Deployment ==="

# Step 1: Build backend locally
echo "Building backend..."
cd /mnt/d/Laburar/backend
npm install
npm run build

# Step 2: Create deployment archive
echo "Creating deployment archive..."
tar -czf ../laburemos-backend.tar.gz \
  --exclude=node_modules \
  --exclude=.env \
  --exclude=.git \
  --exclude=dist \
  .

cd ..

# Step 3: Create production environment file
cat << 'EOF' > backend.env.production
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:Laburemos2025!@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos
JWT_SECRET=laburemos-jwt-secret-production-2025-secure
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=laburemos-refresh-secret-production-2025-secure
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://3.81.56.168:3000,http://laburemos-files-2025.s3-website-us-east-1.amazonaws.com,https://laburemos.com
AWS_REGION=us-east-1
AWS_S3_BUCKET=laburemos-files-2025
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

# Step 4: Copy files to EC2
echo "Copying files to EC2..."
scp -i $KEY_PATH -o StrictHostKeyChecking=no laburemos-backend.tar.gz ec2-user@$EC2_IP:~/
scp -i $KEY_PATH -o StrictHostKeyChecking=no backend.env.production ec2-user@$EC2_IP:~/

# Step 5: Deploy on EC2
echo "Deploying on EC2..."
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ec2-user@$EC2_IP << 'ENDSSH'
set -e

# Setup Node.js environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 16

# Install global dependencies
npm install -g pm2 @nestjs/cli

# Create application directory
rm -rf ~/laburemos-backend
mkdir -p ~/laburemos-backend
cd ~/laburemos-backend

# Extract application
tar -xzf ~/laburemos-backend.tar.gz
rm ~/laburemos-backend.tar.gz

# Copy environment file
cp ~/backend.env.production .env

# Install dependencies
echo "Installing dependencies..."
npm install --production=false

# Build the application
echo "Building application..."
npm run build

# Install production dependencies only
rm -rf node_modules
npm install --production

# Setup PM2 ecosystem file
cat << 'EOF' > ecosystem.config.js
module.exports = {
  apps: [{
    name: 'laburemos-backend',
    script: './dist/main.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    autorestart: true,
    restart_delay: 5000
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Stop any existing PM2 processes
pm2 delete all || true

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Show status
pm2 status
pm2 logs --lines 10

echo "=== Backend deployed successfully ==="
echo "API available at: http://3.81.56.168:3001"
echo "Swagger docs at: http://3.81.56.168:3001/docs"
ENDSSH

# Step 6: Configure nginx reverse proxy
echo "Configuring nginx..."
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ec2-user@$EC2_IP << 'ENDSSH'
sudo tee /etc/nginx/conf.d/laburemos-backend.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name 3.81.56.168;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        return 200 '{"status":"ok","service":"laburemos-backend"}';
        add_header Content-Type application/json;
    }
}
EOF

sudo nginx -t
sudo systemctl restart nginx

echo "Nginx configured successfully"
ENDSSH

echo "=== Deployment Complete ==="
echo "Backend API: http://$EC2_IP:3001"
echo "Through Nginx: http://$EC2_IP/api"
echo "Database: $DB_ENDPOINT"
echo "S3 Bucket: $S3_BUCKET"