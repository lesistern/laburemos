#!/bin/bash
# LaburAR EC2 User Data Script - Complete Server Setup
# This script runs on first boot of the EC2 instance

set -e
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Variables from Terraform
PROJECT_NAME="${project_name}"
STAGE="${stage}"
RDS_ENDPOINT="${rds_endpoint}"
DB_PASSWORD="${db_password}"

echo "Starting LaburAR server setup..."
echo "Project: $PROJECT_NAME"
echo "Stage: $STAGE"
echo "Timestamp: $(date)"

# Update system
yum update -y

# Install development tools
yum groupinstall -y "Development Tools"
yum install -y git curl wget unzip

# Install Node.js 18 LTS
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PM2 for process management
npm install -g pm2

# Install PostgreSQL client
yum install -y postgresql15

# Install Redis
yum install -y redis6
systemctl enable redis6
systemctl start redis6

# Configure Redis for production
cat > /etc/redis6/redis6.conf << 'EOF'
bind 127.0.0.1 ::1
port 6379
timeout 0
tcp-keepalive 300
daemonize yes
supervised systemd
pidfile /var/run/redis6/redis6.pid
loglevel notice
logfile /var/log/redis6/redis6.log
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis6
maxmemory 128mb
maxmemory-policy allkeys-lru
EOF

systemctl restart redis6

# Install Nginx
yum install -y nginx
systemctl enable nginx

# Configure Nginx
cat > /etc/nginx/conf.d/laburar.conf << 'EOF'
# LaburAR Nginx Configuration
upstream frontend {
    server 127.0.0.1:3000;
}

upstream backend {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Backend API
    location /api {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # WebSocket support for real-time features
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend application
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Caching for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://frontend;
        }
    }
    
    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Start Nginx
systemctl start nginx

# Create application directory
mkdir -p /var/www/laburar
cd /var/www/laburar

# Create a placeholder structure until deployment
mkdir -p {backend,frontend,logs}

# Create ecosystem.config.js for PM2
cat > /var/www/laburar/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'laburar-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/laburar/frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)/api',
        NEXT_PUBLIC_WS_URL: 'ws://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)'
      },
      error_file: '/var/www/laburar/logs/frontend-error.log',
      out_file: '/var/www/laburar/logs/frontend-out.log',
      log_file: '/var/www/laburar/logs/frontend.log',
      time: true
    },
    {
      name: 'laburar-backend',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/var/www/laburar/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://laburar_admin:$DB_PASSWORD@$RDS_ENDPOINT:5432/laburar_$STAGE',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: '$(openssl rand -base64 32)',
        STRIPE_SECRET_KEY: '\${STRIPE_SECRET_KEY:-sk_test_dummy}',
        AWS_REGION: '$(curl -s http://169.254.169.254/latest/meta-data/placement/region)'
      },
      error_file: '/var/www/laburar/logs/backend-error.log',
      out_file: '/var/www/laburar/logs/backend-out.log',
      log_file: '/var/www/laburar/logs/backend.log',
      time: true
    }
  ]
};
EOF

# Set proper ownership
chown -R ec2-user:ec2-user /var/www/laburar

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install CloudWatch Agent
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/www/laburar/logs/*.log",
            "log_group_name": "/aws/ec2/laburar/application",
            "log_stream_name": "{instance_id}-application",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/ec2/laburar/nginx",
            "log_stream_name": "{instance_id}-nginx-access",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "/aws/ec2/laburar/nginx",
            "log_stream_name": "{instance_id}-nginx-error",
            "timezone": "UTC"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "LaburAR/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "diskio": {
        "measurement": [
          "io_time",
          "read_bytes",
          "write_bytes",
          "reads",
          "writes"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      },
      "netstat": {
        "measurement": [
          "tcp_established",
          "tcp_time_wait"
        ],
        "metrics_collection_interval": 60
      },
      "swap": {
        "measurement": [
          "swap_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Create custom metrics script
cat > /usr/local/bin/laburar-metrics.sh << 'EOF'
#!/bin/bash
# Custom application metrics for LaburAR

AWS_REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)

# Function to send custom metric
send_metric() {
    local metric_name=$1
    local value=$2
    local unit=${3:-Count}
    
    aws cloudwatch put-metric-data \
        --namespace "LaburAR/Application" \
        --metric-data MetricName=$metric_name,Value=$value,Unit=$unit \
        --region $AWS_REGION
}

# Check application health
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "000")

# Send health metrics
send_metric "FrontendHealth" $FRONTEND_STATUS
send_metric "BackendHealth" $BACKEND_STATUS

# PM2 process metrics
if command -v pm2 >/dev/null 2>&1; then
    FRONTEND_UPTIME=$(pm2 describe laburar-frontend 2>/dev/null | grep -o '"uptime":[0-9]*' | cut -d':' -f2 || echo "0")
    BACKEND_UPTIME=$(pm2 describe laburar-backend 2>/dev/null | grep -o '"uptime":[0-9]*' | cut -d':' -f2 || echo "0")
    
    send_metric "FrontendUptime" $FRONTEND_UPTIME "Seconds"
    send_metric "BackendUptime" $BACKEND_UPTIME "Seconds"
fi

# Redis metrics
if command -v redis-cli >/dev/null 2>&1; then
    REDIS_CONNECTED_CLIENTS=$(redis-cli info clients | grep "connected_clients:" | cut -d':' -f2 | tr -d '\r' || echo "0")
    REDIS_USED_MEMORY=$(redis-cli info memory | grep "used_memory:" | cut -d':' -f2 | tr -d '\r' || echo "0")
    
    send_metric "RedisConnectedClients" $REDIS_CONNECTED_CLIENTS
    send_metric "RedisUsedMemory" $REDIS_USED_MEMORY "Bytes"
fi

# Disk usage
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//' || echo "0")
send_metric "DiskUsagePercent" $DISK_USAGE "Percent"

# Log file sizes (in MB)
if [ -d "/var/www/laburar/logs" ]; then
    LOG_SIZE=$(du -sm /var/www/laburar/logs 2>/dev/null | cut -f1 || echo "0")
    send_metric "LogDirectorySize" $LOG_SIZE "Megabytes"
fi
EOF

chmod +x /usr/local/bin/laburar-metrics.sh

# Add metrics script to cron (every 5 minutes)
echo "*/5 * * * * /usr/local/bin/laburar-metrics.sh" | crontab -

# Install fail2ban for security
yum install -y epel-release
yum install -y fail2ban

# Configure fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
enabled = true

[sshd]
enabled = true
port = ssh
logpath = /var/log/secure
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Configure firewall
systemctl enable firewalld
systemctl start firewalld

# Allow HTTP, HTTPS, and SSH
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload

# Configure swap for better memory management (important for t3.micro)
if [ ! -f /swapfile ]; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# System performance tuning
cat > /etc/sysctl.d/99-laburar.conf << 'EOF'
# Network optimizations
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# File system optimizations
fs.file-max = 65536
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5

# Security
kernel.dmesg_restrict = 1
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
EOF

sysctl -p /etc/sysctl.d/99-laburar.conf

# Configure PostgreSQL client
cat > /home/ec2-user/.pgpass << EOF
$RDS_ENDPOINT:5432:laburar_$STAGE:laburar_admin:$DB_PASSWORD
EOF
chown ec2-user:ec2-user /home/ec2-user/.pgpass
chmod 600 /home/ec2-user/.pgpass

# Test database connection
echo "Testing database connection..."
if sudo -u ec2-user psql -h $RDS_ENDPOINT -U laburar_admin -d laburar_$STAGE -c "SELECT version();" > /dev/null 2>&1; then
    echo "Database connection successful!"
else
    echo "Database connection failed - will retry during application deployment"
fi

# Create deployment script for later use
cat > /usr/local/bin/deploy-laburar.sh << 'EOF'
#!/bin/bash
# LaburAR deployment script for updates
set -e

cd /var/www/laburar

# Stop services
pm2 stop all || echo "No processes to stop"

# Backup current version
if [ -d "backend" ]; then
    tar -czf "backup-$(date +%Y%m%d-%H%M%S).tar.gz" backend frontend || echo "Backup failed"
fi

# Update backend
if [ -d "backend" ]; then
    cd backend
    npm ci --only=production
    npm run build
    npm run db:migrate || echo "Migration failed"
    cd ..
fi

# Update frontend
if [ -d "frontend" ]; then
    cd frontend
    npm ci --only=production
    npm run build
    cd ..
fi

# Start services
pm2 restart ecosystem.config.js --env production
pm2 save

echo "Deployment completed successfully!"
EOF

chmod +x /usr/local/bin/deploy-laburar.sh

# Create health check script
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
# LaburAR health check script

echo "=== LaburAR Health Check ==="
echo "Timestamp: $(date)"

# Check services
echo -n "Nginx: "
if systemctl is-active --quiet nginx; then
    echo "✓ Running"
else
    echo "✗ Not running"
fi

echo -n "Redis: "
if systemctl is-active --quiet redis6; then
    echo "✓ Running"
else
    echo "✗ Not running"
fi

# Check PM2 processes
echo -n "PM2 processes: "
if command -v pm2 >/dev/null 2>&1; then
    pm2 list --no-color | grep -E "(online|stopped|errored)"
else
    echo "PM2 not available"
fi

# Check application endpoints
echo -n "Frontend: "
if curl -f -s -o /dev/null http://localhost:3000; then
    echo "✓ Responding"
else
    echo "✗ Not responding"
fi

echo -n "Backend API: "
if curl -f -s -o /dev/null http://localhost:3001/api/health; then
    echo "✓ Responding"
else
    echo "✗ Not responding"
fi

# Check disk space
echo "Disk usage: $(df -h / | awk 'NR==2 {print $5}')"

# Check memory usage
echo "Memory usage: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"

echo "=== End Health Check ==="
EOF

chmod +x /usr/local/bin/health-check.sh

# Create systemd service for LaburAR
cat > /etc/systemd/system/laburar.service << 'EOF'
[Unit]
Description=LaburAR Application
After=network.target

[Service]
Type=forking
User=ec2-user
WorkingDirectory=/var/www/laburar
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 delete ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable laburar

# Final setup completion
echo "LaburAR server setup completed successfully!"
echo "Server is ready for application deployment."
echo ""
echo "Next steps:"
echo "1. Deploy application code using the deployment script"
echo "2. Configure environment variables"
echo "3. Run database migrations"
echo "4. Start the application services"
echo ""
echo "Useful commands:"
echo "- Health check: /usr/local/bin/health-check.sh"
echo "- Deploy updates: /usr/local/bin/deploy-laburar.sh"
echo "- View logs: pm2 logs"
echo "- Monitor: pm2 monit"

# Log completion
echo "User data script completed at $(date)" >> /var/log/user-data-complete.log