#!/bin/bash

# LaburAR OCI Instance Setup Script
# Automated setup for Oracle Cloud ARM Instance
# Usage: ./setup-oci-instance.sh

set -e

echo "=========================================="
echo "LaburAR OCI Instance Setup Starting..."
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    print_error "This script must be run as the ubuntu user"
    exit 1
fi

# Update system
print_header "System Update"
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    htop \
    iotop \
    nethogs \
    fail2ban \
    ufw \
    certbot \
    python3-certbot-nginx

# Install Node.js 20 LTS
print_header "Node.js Installation"
print_status "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js version: $NODE_VERSION"
print_status "NPM version: $NPM_VERSION"

# Install global Node.js packages
print_status "Installing global Node.js packages..."
sudo npm install -g pm2 typescript @nestjs/cli next

# Install Docker
print_header "Docker Installation"
print_status "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu
print_status "Docker installed. You may need to log out and back in for group changes to take effect."

# Install PostgreSQL 15
print_header "PostgreSQL Installation"
print_status "Installing PostgreSQL 15..."
sudo apt install -y postgresql postgresql-contrib postgresql-client

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configure PostgreSQL
print_status "Configuring PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE USER laburar WITH PASSWORD 'LaburAR2024!@#';
CREATE DATABASE laburar OWNER laburar;
GRANT ALL PRIVILEGES ON DATABASE laburar TO laburar;
\\q
EOF

# Install MySQL 8.0
print_header "MySQL Installation"
print_status "Installing MySQL 8.0..."
sudo apt install -y mysql-server mysql-client

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Configure MySQL
print_status "Configuring MySQL..."
sudo mysql <<EOF
CREATE DATABASE laburar_legacy;
CREATE USER 'laburar'@'localhost' IDENTIFIED BY 'LaburAR2024!@#';
GRANT ALL PRIVILEGES ON laburar_legacy.* TO 'laburar'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF

# Install Redis
print_header "Redis Installation"
print_status "Installing Redis..."
sudo apt install -y redis-server

# Configure Redis
print_status "Configuring Redis..."
sudo sed -i 's/^bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf
sudo sed -i 's/^# maxmemory <bytes>/maxmemory 2gb/' /etc/redis/redis.conf
sudo sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Nginx
print_header "Nginx Installation"
print_status "Installing Nginx..."
sudo apt install -y nginx

# Remove default Nginx configuration
sudo rm -f /etc/nginx/sites-enabled/default

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Setup firewall
print_header "Firewall Configuration"
print_status "Configuring UFW firewall..."
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Configure fail2ban
print_header "Fail2ban Configuration"
print_status "Configuring fail2ban..."
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
EOF

sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Create application directory
print_header "Application Directory Setup"
print_status "Creating application directory..."
sudo mkdir -p /opt/laburar
sudo chown ubuntu:ubuntu /opt/laburar
cd /opt/laburar

# Create directory structure
mkdir -p {frontend,backend,database,logs,scripts,ssl,nginx,backups}

# Create environment files
print_status "Creating environment template files..."

# Backend environment template
tee /opt/laburar/backend/.env.template > /dev/null <<EOF
NODE_ENV=production
PORT=3001

# Database URLs
DATABASE_URL="postgresql://laburar:LaburAR2024!@#@localhost:5432/laburar"
MYSQL_URL="mysql://laburar:LaburAR2024!@#@localhost:3306/laburar_legacy"
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-change-this"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# External Services
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# AWS S3 (if using)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="laburar-uploads"
EOF

# Frontend environment template
tee /opt/laburar/frontend/.env.local.template > /dev/null <<EOF
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
NEXT_PUBLIC_WS_URL="https://your-domain.com"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
EOF

# Create PM2 ecosystem configuration
print_status "Creating PM2 ecosystem configuration..."
tee /opt/laburar/ecosystem.config.js > /dev/null <<EOF
module.exports = {
  apps: [
    {
      name: 'laburar-backend',
      script: 'dist/main.js',
      cwd: '/opt/laburar/backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/opt/laburar/logs/backend-error.log',
      out_file: '/opt/laburar/logs/backend-out.log',
      log_file: '/opt/laburar/logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'laburar-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/opt/laburar/frontend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/opt/laburar/logs/frontend-error.log',
      out_file: '/opt/laburar/logs/frontend-out.log',
      log_file: '/opt/laburar/logs/frontend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

# Create useful scripts
print_header "Creating Management Scripts"

# Health check script
print_status "Creating health check script..."
tee /opt/laburar/scripts/health-check.sh > /dev/null <<'EOF'
#!/bin/bash
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001/health"
LOG_FILE="/opt/laburar/logs/health-check.log"

echo "$(date): Starting health check" >> $LOG_FILE

# Check Frontend
if curl -f -s $FRONTEND_URL > /dev/null; then
    echo "$(date): Frontend OK" >> $LOG_FILE
else
    echo "$(date): Frontend DOWN - Restarting" >> $LOG_FILE
    pm2 restart laburar-frontend
fi

# Check Backend
if curl -f -s $BACKEND_URL > /dev/null; then
    echo "$(date): Backend OK" >> $LOG_FILE
else
    echo "$(date): Backend DOWN - Restarting" >> $LOG_FILE
    pm2 restart laburar-backend
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): WARNING - Disk usage at ${DISK_USAGE}%" >> $LOG_FILE
fi
EOF

chmod +x /opt/laburar/scripts/health-check.sh

# Backup script
print_status "Creating backup script..."
tee /opt/laburar/scripts/backup.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/opt/laburar/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="laburar-backup-$DATE"

mkdir -p $BACKUP_DIR/$BACKUP_NAME

echo "Starting backup process..."

# Database backups
pg_dump -U laburar -h localhost laburar > $BACKUP_DIR/$BACKUP_NAME/postgresql-backup.sql
mysqldump -u laburar -pLaburAR2024!@# laburar_legacy > $BACKUP_DIR/$BACKUP_NAME/mysql-backup.sql

# Application files backup
tar -czf $BACKUP_DIR/$BACKUP_NAME/app-files.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs' \
    --exclude='dist' \
    --exclude='.next' \
    /opt/laburar/frontend /opt/laburar/backend

# Compress entire backup
cd $BACKUP_DIR
tar -czf $BACKUP_NAME.tar.gz $BACKUP_NAME
rm -rf $BACKUP_NAME

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "laburar-backup-*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
EOF

chmod +x /opt/laburar/scripts/backup.sh

# Create systemd service for LaburAR
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/laburar.service > /dev/null <<EOF
[Unit]
Description=LaburAR Application
After=network.target postgresql.service mysql.service redis-server.service

[Service]
Type=forking
User=ubuntu
WorkingDirectory=/opt/laburar
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl enable laburar.service

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/laburar > /dev/null <<EOF
/opt/laburar/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Create status check script
print_status "Creating status check script..."
tee /opt/laburar/scripts/status.sh > /dev/null <<'EOF'
#!/bin/bash
echo "=== LaburAR System Status ==="
echo "Date: $(date)"
echo

echo "=== System Resources ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}'

echo "Memory Usage:"
free -h | awk 'NR==2{printf "Used: %s/%s (%.2f%%)\n", $3,$2,$3*100/$2}'

echo "Disk Usage:"
df -h / | awk 'NR==2{printf "Used: %s/%s (%s)\n", $3,$2,$5}'

echo
echo "=== Services Status ==="
sudo systemctl is-active --quiet postgresql && echo "PostgreSQL: Running" || echo "PostgreSQL: Stopped"
sudo systemctl is-active --quiet mysql && echo "MySQL: Running" || echo "MySQL: Stopped"
sudo systemctl is-active --quiet redis-server && echo "Redis: Running" || echo "Redis: Stopped"
sudo systemctl is-active --quiet nginx && echo "Nginx: Running" || echo "Nginx: Stopped"

echo
echo "=== PM2 Status ==="
pm2 status 2>/dev/null || echo "PM2 not running or no apps"

echo
echo "=== Network Connections ==="
netstat -tlnp 2>/dev/null | grep -E ':3000|:3001|:5432|:3306|:6379' || echo "No services listening"
EOF

chmod +x /opt/laburar/scripts/status.sh

# Setup system optimizations
print_header "System Optimizations"
print_status "Applying system optimizations..."

# Kernel parameters
sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# LaburAR optimizations
vm.swappiness=10
net.core.rmem_max=134217728
net.core.wmem_max=134217728
net.ipv4.tcp_rmem=4096 65536 134217728
net.ipv4.tcp_wmem=4096 65536 134217728
net.core.netdev_max_backlog=5000
EOF

# Apply kernel parameters
sudo sysctl -p

# Node.js optimizations
echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc

# Create quick access aliases
print_status "Setting up aliases..."
tee -a ~/.bashrc > /dev/null <<EOF

# LaburAR aliases
alias laburar-status='/opt/laburar/scripts/status.sh'
alias laburar-logs='pm2 logs'
alias laburar-restart='pm2 restart ecosystem.config.js'
alias laburar-backup='/opt/laburar/scripts/backup.sh'
alias laburar-health='/opt/laburar/scripts/health-check.sh'
EOF

print_header "Setup Complete!"
print_status "LaburAR OCI instance setup completed successfully!"
echo
print_status "Next steps:"
echo "1. Upload your LaburAR source code to /opt/laburar/"
echo "2. Configure environment variables in backend/.env and frontend/.env.local"
echo "3. Set up your domain and SSL certificates"
echo "4. Configure Nginx with your domain"
echo "5. Run database migrations"
echo "6. Start the application with PM2"
echo
print_status "Useful commands:"
echo "- laburar-status    : Check system status"
echo "- laburar-logs      : View application logs"
echo "- laburar-restart   : Restart applications"
echo "- laburar-backup    : Create backup"
echo
print_warning "Please reboot the system to ensure all changes take effect:"
echo "sudo reboot"
echo
print_status "Setup completed at $(date)"