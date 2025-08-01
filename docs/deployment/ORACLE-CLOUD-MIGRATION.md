# LABUREMOS - Oracle Cloud Infrastructure (OCI) Migration Guide

**ARM Compute Instance | Free Tier | Production Deployment**

Complete migration guide from Windows localhost to Oracle Cloud Free Tier ARM instance for LABUREMOS platform.

---

## 📋 Migration Overview

### Current Environment
- **Platform**: LABUREMOS Freelance Platform
- **Stack**: Next.js 15.4.4 + NestJS + PostgreSQL + MySQL
- **Status**: Production Ready (26 tables, JWT auth, real-time chat)
- **Current Location**: C:\xampp\htdocs\Laburar (Windows/XAMPP)
- **Services**: http://localhost:3000 (Next.js), http://localhost:3001/docs (NestJS)

### Target Environment
- **Cloud Provider**: Oracle Cloud Infrastructure (OCI)
- **Instance Type**: ARM Compute Instance (Always Free Tier)
- **Specifications**: 4 ARM cores, 24GB RAM, 200GB storage
- **OS**: Ubuntu 22.04 LTS ARM64
- **Domain**: Production domain with SSL certificates

### Migration Benefits
- **Cost**: $0/month with OCI Free Tier
- **Performance**: ARM64 optimization, 24GB RAM
- **Scalability**: Production-ready infrastructure
- **Reliability**: Enterprise-grade cloud platform
- **Security**: Production security hardening

---

## 🚀 Phase 1: Oracle Cloud Setup

### 1.1 OCI Account Creation
```bash
# 1. Create OCI account
# → Visit: https://cloud.oracle.com
# → Sign up with valid credit card (required, not charged)
# → Verify email and phone number
# → Account activation takes 24-48 hours

# 2. Access OCI Console
# → Login: https://cloud.oracle.com/sign-in
# → Select your tenancy
# → Navigate to Compute → Instances
```

### 1.2 Network Configuration
```bash
# Create Virtual Cloud Network (VCN)
# Console → Networking → Virtual Cloud Networks

VCN Configuration:
- Name: laburar-vcn
- CIDR Block: 10.0.0.0/16
- Enable DNS Resolution: Yes
- DNS Label: laburarvcn

# Create Internet Gateway
# VCN Details → Internet Gateways → Create
- Name: laburar-igw
- Enable: Yes

# Create Route Table
# VCN Details → Route Tables → Create
- Name: laburar-public-rt
- Route Rules:
  - Destination CIDR: 0.0.0.0/0
  - Target Type: Internet Gateway
  - Target: laburar-igw

# Create Subnet
# VCN Details → Subnets → Create
- Name: laburar-public-subnet
- Type: Regional
- CIDR Block: 10.0.1.0/24
- Route Table: laburar-public-rt
- Public Subnet: Yes
- DNS Label: laburarsubnet
```

### 1.3 Security Group Configuration
```bash
# Create Security List
# VCN Details → Security Lists → Create
Name: laburar-security-list

# Ingress Rules (Inbound)
Protocol  Port    Source        Description
TCP      22      0.0.0.0/0     SSH Access
TCP      80      0.0.0.0/0     HTTP
TCP      443     0.0.0.0/0     HTTPS
TCP      3000    0.0.0.0/0     Next.js Frontend
TCP      3001    0.0.0.0/0     NestJS API
TCP      5432    10.0.0.0/16   PostgreSQL (VCN only)
TCP      3306    10.0.0.0/16   MySQL (VCN only)
TCP      6379    10.0.0.0/16   Redis (VCN only)

# Egress Rules (Outbound)
Protocol  Port    Destination   Description
All      All     0.0.0.0/0     All outbound traffic
```

### 1.4 ARM Compute Instance Creation
```bash
# Console → Compute → Instances → Create Instance

Instance Configuration:
- Name: laburar-production
- Compartment: root (default)
- Availability Domain: Any available
- Image: Canonical Ubuntu 22.04 LTS ARM64
- Shape: VM.Standard.A1.Flex (Always Free)
  - OCPUs: 4 (maximum for free tier)
  - Memory: 24 GB (maximum for free tier)
- Primary VNIC:
  - VCN: laburar-vcn
  - Subnet: laburar-public-subnet
  - Assign Public IP: Yes
- Boot Volume: 200 GB (maximum for free tier)
- SSH Keys: Upload your public key or generate new
```

### 1.5 SSH Key Setup
```bash
# Generate SSH key pair (Windows)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/laburar-oci -C "laburar@production"

# Or use existing key
# Upload public key during instance creation
# Save private key securely for SSH access
```

---

## 🔧 Phase 2: Server Environment Setup

### 2.1 Initial Server Connection
```bash
# Connect to instance (replace with your public IP)
ssh -i ~/.ssh/laburar-oci ubuntu@<YOUR_PUBLIC_IP>

# First time setup
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common
```

### 2.2 Node.js Installation (ARM64)
```bash
# Install Node.js 20 LTS (ARM64 optimized)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x

# Install global packages
sudo npm install -g pm2 typescript nest-cli next
```

### 2.3 PostgreSQL Installation (ARM64)
```bash
# Install PostgreSQL 15
sudo apt install -y postgresql postgresql-contrib postgresql-client

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configure PostgreSQL
sudo -u postgres psql

-- Inside PostgreSQL prompt:
CREATE USER laburemos WITH PASSWORD 'LABUREMOS2024!@#';
CREATE DATABASE laburar OWNER laburar;
GRANT ALL PRIVILEGES ON DATABASE laburar TO laburar;
\q

# Configure PostgreSQL for connections
sudo nano /etc/postgresql/15/main/postgresql.conf
# Add: listen_addresses = 'localhost'

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: local   laburar   laburar   md5

sudo systemctl restart postgresql
```

### 2.4 MySQL Installation (ARM64)
```bash
# Install MySQL 8.0
sudo apt install -y mysql-server mysql-client

# Secure MySQL installation
sudo mysql_secure_installation

# Configure MySQL
sudo mysql

-- Inside MySQL prompt:
CREATE DATABASE laburar_legacy;
CREATE USER 'laburemos'@'localhost' IDENTIFIED BY 'LABUREMOS2024!@#';
GRANT ALL PRIVILEGES ON laburar_legacy.* TO 'laburar'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Test connection
mysql -u laburar -p laburar_legacy
```

### 2.5 Redis Installation (ARM64)
```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Modify: bind 127.0.0.1 ::1
# Modify: maxmemory 2gb
# Modify: maxmemory-policy allkeys-lru

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping  # Should return PONG
```

### 2.6 Nginx Installation and Configuration
```bash
# Install Nginx
sudo apt install -y nginx

# Remove default configuration
sudo rm /etc/nginx/sites-enabled/default

# Create LABUREMOS configuration
sudo nano /etc/nginx/sites-available/laburar

# Add configuration (see section 2.7)
sudo ln -s /etc/nginx/sites-available/laburar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.7 Nginx Configuration File
```nginx
# /etc/nginx/sites-available/laburar
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Next.js Frontend (Port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # NestJS API (Port 3001)
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 📦 Phase 3: Application Deployment

### 3.1 Create Application Directory
```bash
# Create application directory
sudo mkdir -p /opt/laburar
sudo chown ubuntu:ubuntu /opt/laburar
cd /opt/laburar

# Create directory structure
mkdir -p {frontend,backend,database,logs,scripts,ssl}
```

### 3.2 Transfer Files from Windows
```bash
# From Windows machine (PowerShell/CMD)
# Option 1: Using SCP
scp -r -i ~/.ssh/laburar-oci C:\xampp\htdocs\Laburar\frontend ubuntu@<YOUR_PUBLIC_IP>:/opt/laburar/
scp -r -i ~/.ssh/laburar-oci C:\xampp\htdocs\Laburar\backend ubuntu@<YOUR_PUBLIC_IP>:/opt/laburar/
scp -i ~/.ssh/laburar-oci C:\xampp\htdocs\Laburar\database\*.sql ubuntu@<YOUR_PUBLIC_IP>:/opt/laburar/database/

# Option 2: Using Git (Recommended)
# First, commit your code to Git repository
cd C:\xampp\htdocs\Laburar
git add .
git commit -m "Prepare for OCI deployment"
git push origin main

# Then clone on OCI instance
cd /opt/laburar
git clone https://github.com/yourusername/laburar.git .
```

### 3.3 Environment Configuration
```bash
# Backend environment configuration
cd /opt/laburar/backend
cp .env.example .env
nano .env

# Backend .env configuration
NODE_ENV=production
PORT=3001

# Database URLs
DATABASE_URL="postgresql://laburemos:LABUREMOS2024!@#@localhost:5432/laburemos"
MYSQL_URL="mysql://laburemos:LABUREMOS2024!@#@localhost:3306/laburemos_legacy"
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

# Frontend environment configuration
cd /opt/laburar/frontend
cp .env.local.example .env.local
nano .env.local

# Frontend .env.local configuration
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
NEXT_PUBLIC_WS_URL="https://your-domain.com"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
```

### 3.4 Database Migration
```bash
# Import MySQL legacy database
cd /opt/laburar/database
mysql -u laburar -p laburar_legacy < create_laburar_db.sql
mysql -u laburar -p laburar_legacy < database-updates.sql

# Setup PostgreSQL database
cd /opt/laburar/backend
npm install
npm run db:generate
npm run db:migrate
npm run db:seed

# Verify database connections
npm run test:db
```

### 3.5 Build Applications
```bash
# Build Backend
cd /opt/laburar/backend
npm ci --production=false
npm run build

# Build Frontend
cd /opt/laburar/frontend
npm ci --production=false
npm run build

# Test builds
cd /opt/laburar/backend && npm run start:prod &
cd /opt/laburar/frontend && npm run start &

# Check if services are running
curl http://localhost:3001/health
curl http://localhost:3000
```

---

## 🔒 Phase 4: SSL and Domain Configuration

### 4.1 Domain Setup
```bash
# 1. Purchase domain or use existing
# 2. Point A record to your OCI instance public IP
# Example DNS configuration:
# A    @           <YOUR_PUBLIC_IP>
# A    www         <YOUR_PUBLIC_IP>
# CNAME api       @

# 3. Verify DNS propagation
dig your-domain.com +short
nslookup your-domain.com
```

### 4.2 SSL Certificate with Let's Encrypt
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Stop Nginx temporarily
sudo systemctl stop nginx

# Generate SSL certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Update Nginx configuration for HTTPS
sudo nano /etc/nginx/sites-available/laburar
```

### 4.3 Updated Nginx Configuration with SSL
```nginx
# /etc/nginx/sites-available/laburar
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Rest of configuration same as before...
    # (Frontend, API, WebSocket, static files)
}
```

### 4.4 SSL Certificate Auto-Renewal
```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Setup automatic renewal
sudo crontab -e
# Add line:
0 12 * * * /usr/bin/certbot renew --quiet

# Restart Nginx
sudo systemctl start nginx
sudo systemctl reload nginx
```

---

## 🚀 Phase 5: Production Process Management

### 5.1 PM2 Configuration
```bash
# Create PM2 ecosystem file
cd /opt/laburar
nano ecosystem.config.js
```

### 5.2 PM2 Ecosystem Configuration
```javascript
// /opt/laburar/ecosystem.config.js
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
```

### 5.3 Start Production Services
```bash
# Start applications with PM2
cd /opt/laburar
pm2 start ecosystem.config.js

# Enable PM2 startup on boot
pm2 startup
pm2 save

# Monitor applications
pm2 status
pm2 logs
pm2 monit
```

### 5.4 System Service Configuration
```bash
# Create systemd services for additional reliability
sudo nano /etc/systemd/system/laburar.service

# Add service configuration
[Unit]
Description=LABUREMOS Application
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

# Enable service
sudo systemctl enable laburar.service
sudo systemctl start laburar.service
```

---

## 📊 Phase 6: Monitoring and Logging

### 6.1 Log Management
```bash
# Create log rotation configuration
sudo nano /etc/logrotate.d/laburar

# Add configuration
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

# Create monitoring script
nano /opt/laburar/scripts/health-check.sh
```

### 6.2 Health Check Script
```bash
#!/bin/bash
# /opt/laburar/scripts/health-check.sh

# Health check script for LABUREMOS
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

# Check Database connections
cd /opt/laburar/backend
if npm run test:db > /dev/null 2>&1; then
    echo "$(date): Database OK" >> $LOG_FILE
else
    echo "$(date): Database issues detected" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): WARNING - Disk usage at ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE > 90" | bc -l) )); then
    echo "$(date): WARNING - Memory usage at ${MEMORY_USAGE}%" >> $LOG_FILE
fi

chmod +x /opt/laburar/scripts/health-check.sh

# Schedule health checks
crontab -e
# Add:
*/5 * * * * /opt/laburar/scripts/health-check.sh
```

### 6.3 Performance Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Install Node.js monitoring tools
npm install -g clinic
cd /opt/laburar/backend
npm install --save-dev clinic

# Create monitoring dashboard script
nano /opt/laburar/scripts/monitoring.sh
```

### 6.4 Monitoring Dashboard Script
```bash
#!/bin/bash
# /opt/laburar/scripts/monitoring.sh

echo "=== LABUREMOS System Monitoring ==="
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
echo "=== Application Status ==="
pm2 status

echo
echo "=== Network Connections ==="
netstat -tlnp | grep -E ':3000|:3001|:5432|:3306|:6379'

echo
echo "=== Recent Errors (Last 10) ==="
tail -n 10 /opt/laburar/logs/backend-error.log
tail -n 10 /opt/laburar/logs/frontend-error.log

chmod +x /opt/laburar/scripts/monitoring.sh
```

---

## 🔄 Phase 7: CI/CD Pipeline

### 7.1 GitHub Actions Workflow
```yaml
# .github/workflows/deploy-oci.yml
name: Deploy to Oracle Cloud

on:
  push:
    branches: [ main, production ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install Backend Dependencies
      run: |
        cd backend
        npm ci

    - name: Install Frontend Dependencies
      run: |
        cd frontend
        npm ci

    - name: Run Backend Tests
      run: |
        cd backend
        npm run test
        npm run test:e2e
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379

    - name: Run Frontend Tests
      run: |
        cd frontend
        npm run test
        npm run build

    - name: Build Backend
      run: |
        cd backend
        npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v4

    - name: Deploy to OCI
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.OCI_HOST }}
        username: ubuntu
        key: ${{ secrets.OCI_SSH_KEY }}
        script: |
          cd /opt/laburar
          git pull origin main
          
          # Backend deployment
          cd backend
          npm ci --production=false
          npm run build
          
          # Frontend deployment
          cd ../frontend
          npm ci --production=false
          npm run build
          
          # Restart services
          pm2 restart ecosystem.config.js
          
          # Health check
          sleep 10
          curl -f http://localhost:3000 || exit 1
          curl -f http://localhost:3001/health || exit 1
```

### 7.2 Deployment Scripts
```bash
# Create deployment script
nano /opt/laburar/scripts/deploy.sh
```

```bash
#!/bin/bash
# /opt/laburar/scripts/deploy.sh

set -e

echo "Starting LABUREMOS deployment..."

# Backup current version
echo "Creating backup..."
cp -r /opt/laburar /opt/laburar-backup-$(date +%Y%m%d-%H%M%S)

# Pull latest code
echo "Pulling latest code..."
cd /opt/laburar
git pull origin main

# Install dependencies and build
echo "Building backend..."
cd backend
npm ci --production=false
npm run build

echo "Building frontend..."
cd ../frontend
npm ci --production=false
npm run build

# Database migrations
echo "Running database migrations..."
cd ../backend
npm run db:migrate

# Restart services with zero downtime
echo "Restarting services..."
pm2 reload ecosystem.config.js

# Health check
echo "Performing health check..."
sleep 10

if curl -f http://localhost:3000 > /dev/null 2>&1 && \
   curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "Deployment successful!"
    # Clean old backups (keep last 5)
    ls -t /opt/laburar-backup-* | tail -n +6 | xargs rm -rf
else
    echo "Health check failed! Rolling back..."
    pm2 stop ecosystem.config.js
    # Rollback logic here
    exit 1
fi

chmod +x /opt/laburar/scripts/deploy.sh
```

---

## 🛡️ Phase 8: Security Hardening

### 8.1 Firewall Configuration
```bash
# Enable UFW firewall
sudo ufw enable

# Configure firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if needed)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow specific application ports (if needed for direct access)
sudo ufw allow from 10.0.0.0/16 to any port 3000
sudo ufw allow from 10.0.0.0/16 to any port 3001

# Check status
sudo ufw status verbose
```

### 8.2 SSH Hardening
```bash
# Backup SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Recommended SSH settings:
Port 22                          # Consider changing to non-standard port
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
UsePAM yes
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers ubuntu
Protocol 2

# Restart SSH service
sudo systemctl restart sshd
```

### 8.3 Application Security
```bash
# Install fail2ban for intrusion prevention
sudo apt install -y fail2ban

# Configure fail2ban
sudo nano /etc/fail2ban/jail.local

# Add configuration:
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

# Start fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 8.4 Database Security
```bash
# PostgreSQL security
sudo nano /etc/postgresql/15/main/postgresql.conf

# Secure PostgreSQL settings:
listen_addresses = 'localhost'
ssl = on
log_connections = on
log_disconnections = on
log_line_prefix = '%t [%p-%l] %q%u@%d '

# MySQL security
sudo mysql_secure_installation

# Create database-specific users with limited privileges
sudo mysql

CREATE USER 'laburar_read'@'localhost' IDENTIFIED BY 'ReadOnlyPassword2024!';
GRANT SELECT ON laburar_legacy.* TO 'laburar_read'@'localhost';

CREATE USER 'laburar_backup'@'localhost' IDENTIFIED BY 'BackupPassword2024!';
GRANT SELECT, LOCK TABLES ON laburar_legacy.* TO 'laburar_backup'@'localhost';

FLUSH PRIVILEGES;
```

---

## 💾 Phase 9: Backup and Disaster Recovery

### 9.1 Automated Backup Script
```bash
# Create backup script
nano /opt/laburar/scripts/backup.sh
```

```bash
#!/bin/bash
# /opt/laburar/scripts/backup.sh

BACKUP_DIR="/opt/laburar/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="laburar-backup-$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR/$BACKUP_NAME

echo "Starting backup process..."

# Database backups
echo "Backing up PostgreSQL..."
pg_dump -U laburar -h localhost laburar > $BACKUP_DIR/$BACKUP_NAME/postgresql-backup.sql

echo "Backing up MySQL..."
mysqldump -u laburar -p laburar_legacy > $BACKUP_DIR/$BACKUP_NAME/mysql-backup.sql

# Application files backup
echo "Backing up application files..."
tar -czf $BACKUP_DIR/$BACKUP_NAME/app-files.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs' \
    --exclude='dist' \
    --exclude='.next' \
    /opt/laburar/frontend /opt/laburar/backend

# Configuration backup
echo "Backing up configuration..."
cp /etc/nginx/sites-available/laburar $BACKUP_DIR/$BACKUP_NAME/nginx-config
cp /opt/laburar/ecosystem.config.js $BACKUP_DIR/$BACKUP_NAME/pm2-config.js

# SSL certificates backup
if [ -d "/etc/letsencrypt/live/your-domain.com" ]; then
    cp -r /etc/letsencrypt/live/your-domain.com $BACKUP_DIR/$BACKUP_NAME/ssl-certs
fi

# Create backup summary
echo "Backup Date: $DATE" > $BACKUP_DIR/$BACKUP_NAME/backup-info.txt
echo "PostgreSQL: $(wc -l < $BACKUP_DIR/$BACKUP_NAME/postgresql-backup.sql) lines" >> $BACKUP_DIR/$BACKUP_NAME/backup-info.txt
echo "MySQL: $(wc -l < $BACKUP_DIR/$BACKUP_NAME/mysql-backup.sql) lines" >> $BACKUP_DIR/$BACKUP_NAME/backup-info.txt
echo "App Files: $(du -sh $BACKUP_DIR/$BACKUP_NAME/app-files.tar.gz)" >> $BACKUP_DIR/$BACKUP_NAME/backup-info.txt

# Compress entire backup
cd $BACKUP_DIR
tar -czf $BACKUP_NAME.tar.gz $BACKUP_NAME
rm -rf $BACKUP_NAME

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "laburar-backup-*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
```

### 9.2 Backup Scheduling
```bash
# Make backup script executable
chmod +x /opt/laburar/scripts/backup.sh

# Schedule daily backups
crontab -e

# Add backup schedule:
# Daily backup at 2 AM
0 2 * * * /opt/laburar/scripts/backup.sh >> /opt/laburar/logs/backup.log 2>&1

# Weekly full system backup at 3 AM on Sundays
0 3 * * 0 /opt/laburar/scripts/full-backup.sh >> /opt/laburar/logs/backup.log 2>&1
```

### 9.3 Disaster Recovery Plan
```bash
# Create recovery script
nano /opt/laburar/scripts/restore.sh
```

```bash
#!/bin/bash
# /opt/laburar/scripts/restore.sh

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file>"
    echo "Available backups:"
    ls -la /opt/laburar/backups/laburar-backup-*.tar.gz
    exit 1
fi

BACKUP_FILE="$1"
RESTORE_DIR="/opt/laburar/restore-$(date +%Y%m%d-%H%M%S)"

echo "Starting disaster recovery from $BACKUP_FILE..."

# Create restore directory
mkdir -p $RESTORE_DIR
cd $RESTORE_DIR

# Extract backup
tar -xzf $BACKUP_FILE

# Stop current services
pm2 stop ecosystem.config.js

# Restore databases
echo "Restoring PostgreSQL..."
dropdb -U laburar laburar
createdb -U laburar laburar
psql -U laburar laburar < */postgresql-backup.sql

echo "Restoring MySQL..."
mysql -u laburar -p -e "DROP DATABASE IF EXISTS laburar_legacy; CREATE DATABASE laburar_legacy;"
mysql -u laburar -p laburar_legacy < */mysql-backup.sql

# Restore application files
echo "Restoring application files..."
cd /opt/laburar
tar -xzf $RESTORE_DIR/*/app-files.tar.gz --strip-components=1

# Restore configuration
cp $RESTORE_DIR/*/nginx-config /etc/nginx/sites-available/laburar
cp $RESTORE_DIR/*/pm2-config.js /opt/laburar/ecosystem.config.js

# Restart services
nginx -s reload
pm2 start ecosystem.config.js

echo "Disaster recovery completed!"
```

---

## 🎯 Phase 10: Final Production Checklist

### 10.1 Performance Optimization
```bash
# Enable production optimizations
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'net.core.rmem_max=134217728' | sudo tee -a /etc/sysctl.conf
echo 'net.core.wmem_max=134217728' | sudo tee -a /etc/sysctl.conf

# Apply kernel parameters
sudo sysctl -p

# Optimize Node.js for ARM
export NODE_OPTIONS="--max-old-space-size=4096"
echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc

# Setup production environment variables
sudo nano /etc/environment

# Add:
NODE_ENV=production
PORT=3000
```

### 10.2 Security Verification
```bash
# Security checklist script
nano /opt/laburar/scripts/security-check.sh
```

```bash
#!/bin/bash
# /opt/laburar/scripts/security-check.sh

echo "=== LABUREMOS Security Verification ==="

# Check SSL certificate
echo "1. SSL Certificate:"
openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Check open ports
echo "2. Open Ports:"
nmap -sT -O localhost

# Check file permissions
echo "3. File Permissions:"
ls -la /opt/laburar/backend/.env
ls -la /etc/nginx/sites-available/laburar

# Check database security
echo "4. Database Security:"
sudo -u postgres psql -c "\du"

# Check fail2ban status
echo "5. Fail2ban Status:"
sudo fail2ban-client status

# Check firewall status
echo "6. Firewall Status:"
sudo ufw status verbose

# Check for security updates
echo "7. Security Updates:"
apt list --upgradable | grep -i security

chmod +x /opt/laburar/scripts/security-check.sh
```

### 10.3 Final Deployment Verification
```bash
# Complete verification script
nano /opt/laburar/scripts/production-verify.sh
```

```bash
#!/bin/bash
# /opt/laburar/scripts/production-verify.sh

echo "=== LABUREMOS Production Verification ==="

# Test all endpoints
echo "1. Testing Frontend..."
curl -f https://your-domain.com/ || echo "Frontend FAILED"

echo "2. Testing Backend API..."
curl -f https://your-domain.com/api/health || echo "Backend API FAILED"

echo "3. Testing Database Connection..."
cd /opt/laburar/backend && npm run test:db || echo "Database FAILED"

echo "4. Testing SSL Certificate..."
curl -I https://your-domain.com/ | grep "HTTP/2 200" || echo "SSL FAILED"

echo "5. Testing WebSocket..."
# WebSocket test would require more complex verification

echo "6. Performance Test..."
curl -o /dev/null -s -w "Time: %{time_total}s\n" https://your-domain.com/

echo "7. Memory Usage..."
free -h

echo "8. Disk Usage..."
df -h /

echo "9. PM2 Status..."
pm2 status

echo "10. Service Status..."
sudo systemctl status nginx postgresql mysql redis-server

echo "=== Verification Complete ==="

chmod +x /opt/laburar/scripts/production-verify.sh
```

---

## 📚 Phase 11: Documentation and Maintenance

### 11.1 Create Production Documentation
```bash
# Create maintenance documentation
nano /opt/laburar/docs/PRODUCTION-MAINTENANCE.md
```

### 11.2 Maintenance Schedule
```
Daily Tasks:
- Monitor application logs
- Check system resources
- Verify backup completion
- Review security logs

Weekly Tasks:
- Update system packages
- Review application performance
- Check SSL certificate expiry
- Clean old log files

Monthly Tasks:
- Review and rotate credentials
- Update dependencies
- Security audit
- Disaster recovery test
- Performance optimization review
```

### 11.3 Troubleshooting Guide
```bash
# Common issues and solutions
nano /opt/laburar/docs/TROUBLESHOOTING.md

# Key troubleshooting commands:
pm2 logs                    # Check application logs
sudo journalctl -u nginx    # Check Nginx logs
sudo systemctl status       # Check service statuses
df -h                       # Check disk space
free -h                     # Check memory usage
netstat -tlnp              # Check port usage
```

---

## 🎉 Migration Complete!

### Final Production URLs
- **Frontend**: https://your-domain.com
- **API Documentation**: https://your-domain.com/api/docs
- **Admin Panel**: https://your-domain.com/admin

### Key Management Commands
```bash
# Service Management
pm2 status                  # Check application status
pm2 restart all            # Restart all applications
pm2 logs                   # View logs
sudo systemctl reload nginx # Reload Nginx

# Maintenance
/opt/laburar/scripts/backup.sh              # Manual backup
/opt/laburar/scripts/production-verify.sh   # Verify production
/opt/laburar/scripts/deploy.sh              # Deploy updates
```

### Success Metrics
- **Zero Downtime**: Production deployment achieved
- **ARM Optimization**: Full ARM64 compatibility
- **Security**: Production-grade security hardening
- **Performance**: Sub-second response times
- **Reliability**: 99.9% uptime target
- **Cost**: $0/month with OCI Free Tier

Your LABUREMOS platform is now successfully migrated to Oracle Cloud Infrastructure with enterprise-grade security, monitoring, and scalability!