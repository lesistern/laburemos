# Oracle Cloud Infrastructure - LABUREMOS Platform Migration Guide

**Professional Freelance Platform** | Next.js 15.4.4 + NestJS → Oracle Cloud Infrastructure

## 🎯 Overview

Complete migration guide for LABUREMOS platform from local development to Oracle Cloud Infrastructure (OCI), optimized for Next.js + NestJS stack with MySQL and PostgreSQL databases.

### Current Stack Migration
```
Local Development          Oracle Cloud Production
┌─────────────────┐       ┌─────────────────┐
│ Next.js 15.4.4  │  ───► │ OCI Compute     │
│ NestJS Backend  │       │ VM.Standard.A1  │
│ MySQL + PostgreSQL     │ 4 OCPUs, 24GB   │
│ XAMPP (Windows) │       │ Oracle Linux 8  │
└─────────────────┘       └─────────────────┘
```

## 🏗️ Infrastructure Architecture

### **Compute Instance Configuration**

#### Primary Instance: Application Server
```yaml
Instance Details:
  Name: laburemos-prod-01
  Shape: VM.Standard.A1.Flex (ARM Ampere)
  OS: Oracle Linux 8 (Latest)
  
Resource Allocation:
  Production:
    OCPUs: 4 (scalable to 8)
    Memory: 24GB (scalable to 48GB)
    Storage: 300GB total
  
  Development:
    OCPUs: 2
    Memory: 12GB
    Storage: 200GB total

Always Free Eligible:
  ✅ Up to 4 OCPUs ARM
  ✅ Up to 24GB Memory
  ✅ 200GB Block Storage
  ✅ Perfect for LABUREMOS stack
```

#### Resource Distribution
```yaml
Application Layer:
  Next.js Frontend (Port 3000):
    CPU: 1-2 OCPUs
    Memory: 4-8GB RAM
    
  NestJS API (Port 3001):
    CPU: 1-2 OCPUs
    Memory: 4-8GB RAM
    
  Node.js Runtime Overhead:
    CPU: 0.5 OCPU
    Memory: 2GB RAM

Database Layer:
  MySQL (Port 3306):
    CPU: 1 OCPU
    Memory: 4-8GB RAM
    
  PostgreSQL (Port 5432):
    CPU: 1 OCPU
    Memory: 4-8GB RAM

System Resources:
  OS + Monitoring:
    CPU: 0.5 OCPU
    Memory: 2-4GB RAM
```

## 🌐 Network Configuration

### **Virtual Cloud Network (VCN) Setup**

#### VCN Architecture
```yaml
VCN Configuration:
  Name: laburemos-vcn
  CIDR Block: 10.0.0.0/16
  DNS Resolution: Enabled
  DNS Label: laburemos
  Region: Choose closest to users

Subnet Design:
  Public Subnet (Web Tier):
    Name: laburemos-public-subnet
    CIDR: 10.0.1.0/24
    Internet Gateway: Enabled
    Route Table: Public routes
    
  Private Subnet (Database Tier):
    Name: laburemos-private-subnet  
    CIDR: 10.0.2.0/24
    NAT Gateway: Enabled
    Route Table: Private routes
```

#### Load Balancer Configuration
```yaml
Load Balancer:
  Name: laburemos-lb
  Type: Network Load Balancer
  Bandwidth: 10 Mbps (Always Free)
  
  Backend Sets:
    Frontend-Backend:
      Port: 3000
      Health Check: /api/health
      
    API-Backend:
      Port: 3001  
      Health Check: /docs
```

### **Security Configuration**

#### Network Security Groups (NSGs)
```yaml
Web-Tier-NSG:
  Name: laburemos-web-nsg
  Ingress Rules:
    - Port 80/TCP from 0.0.0.0/0 (HTTP)
    - Port 443/TCP from 0.0.0.0/0 (HTTPS)
    - Port 22/TCP from YOUR_IP/32 (SSH Admin)
  Egress Rules:
    - All traffic to 0.0.0.0/0

App-Tier-NSG:
  Name: laburemos-app-nsg
  Ingress Rules:
    - Port 3000/TCP from Web-Tier-NSG (Next.js)
    - Port 3001/TCP from Web-Tier-NSG (NestJS)
    - Port 22/TCP from Bastion/Admin IPs
  Egress Rules:
    - Port 3306/TCP to Database-NSG (MySQL)
    - Port 5432/TCP to Database-NSG (PostgreSQL)
    - All traffic to 0.0.0.0/0 (External APIs)

Database-NSG:
  Name: laburemos-db-nsg
  Ingress Rules:
    - Port 3306/TCP from App-Tier-NSG (MySQL)
    - Port 5432/TCP from App-Tier-NSG (PostgreSQL)
  Egress Rules:
    - None (Database isolation)
```

#### Firewall Rules (OS Level)
```bash
# Firewall Commands for Oracle Linux
sudo firewall-cmd --zone=public --permanent --add-port=3000/tcp
sudo firewall-cmd --zone=public --permanent --add-port=3001/tcp
sudo firewall-cmd --zone=public --permanent --add-port=80/tcp
sudo firewall-cmd --zone=public --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## 💾 Storage Configuration

### **Block Volume Architecture**

#### Boot Volume
```yaml
Boot Volume:
  Name: laburemos-boot-volume
  Size: 50GB (minimum for OS + applications)
  Performance: Balanced (10 VPUs)
  Backup Policy: Bronze (weekly backups)
  Encryption: Oracle-managed keys
```

#### Application Data Volume
```yaml
App Data Volume:
  Name: laburemos-app-volume
  Size: 100GB
  Performance: Higher Performance (20 VPUs)
  Mount Point: /opt/laburemos
  Purpose: Application files, logs, uploads
  Backup Policy: Silver (daily backups)
```

#### Database Volumes
```yaml
MySQL Data Volume:
  Name: laburemos-mysql-volume
  Size: 200GB
  Performance: Ultra High Performance (30+ VPUs)
  Mount Point: /var/lib/mysql
  IOPS: 25,000+ (for high-traffic scenarios)
  Backup Policy: Gold (daily + weekly)

PostgreSQL Data Volume:
  Name: laburemos-postgres-volume
  Size: 200GB
  Performance: Ultra High Performance (30+ VPUs)  
  Mount Point: /var/lib/postgresql
  IOPS: 25,000+ (for complex queries)
  Backup Policy: Gold (daily + weekly)
```

### **Object Storage Integration**

#### Bucket Configuration
```yaml
Static Assets Bucket:
  Name: laburemos-static-assets
  Tier: Standard
  Versioning: Enabled
  Public Access: Limited (CDN only)
  Purpose: Images, CSS, JS, user uploads
  
Backup Bucket:
  Name: laburemos-backups
  Tier: Archive
  Retention: 90 days
  Access: Private
  Purpose: Database backups, log archives
  
Configuration Bucket:
  Name: laburemos-config
  Tier: Standard
  Access: Private
  Purpose: Environment configs, certificates
```

## 🚀 OCI Console Step-by-Step Creation

### **Step 1: Create VCN**
```bash
Navigation: Networking → Virtual Cloud Networks → Create VCN

VCN Details:
✓ Name: laburemos-vcn
✓ Compartment: [Your compartment]
✓ CIDR Block: 10.0.0.0/16
✓ Use VCN Wizard: ✅ VCN with Internet Connectivity
✓ Public Subnet CIDR: 10.0.1.0/24
✓ Private Subnet CIDR: 10.0.2.0/24
```

### **Step 2: Create Compute Instance**
```bash
Navigation: Compute → Instances → Create Instance

Basic Information:
✓ Name: laburemos-prod-01
✓ Create in Compartment: [Your compartment]
✓ Placement:
  - Availability Domain: AD-1
  - Fault Domain: FD-1

Image and Shape:
✓ Image: Oracle Linux 8 (x86_64)
✓ Shape: VM.Standard.A1.Flex
✓ OCPUs: 4 (start with 2, scale up)
✓ Memory (GB): 24 (start with 12, scale up)
✓ Network Bandwidth (Gbps): 4

Primary VNIC:
✓ Primary Network: laburemos-vcn
✓ Subnet: laburemos-public-subnet (10.0.1.0/24)
✓ Public IPv4 Address: ✅ Assign a public IPv4 address
✓ Private IPv4 Address: Automatic
✓ Hostname Label: laburemos-prod-01

SSH Keys:
✓ Upload SSH Key Files: [Upload your public key]
✓ Or paste SSH keys: [Paste public key content]

Boot Volume:
✓ Specify a custom boot volume size: ✅
✓ Boot Volume Size (GB): 50
✓ Boot Volume VPUs: 10 (Balanced)

Advanced Options:
✓ Management Tab:
  - Cloud-init script: [See script below]
✓ Oracle Cloud Agent Tab:
  - Management Agent: ✅
  - Monitoring: ✅
  - OS Management Service: ✅
```

### **Step 3: Cloud-Init Configuration Script**
```bash
#!/bin/bash
# LABUREMOS Platform Setup Script for Oracle Linux 8

# System Update
yum update -y

# Install Node.js 18 LTS (required for Next.js 15.4.4)
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install essential packages
yum install -y git curl wget unzip vim htop

# Install PM2 for process management
npm install -g pm2 @nestjs/cli

# Install and configure MySQL 8.0
yum install -y mysql-server
systemctl enable mysqld
systemctl start mysqld

# Install and configure PostgreSQL 14
yum install -y postgresql-server postgresql
postgresql-setup initdb
systemctl enable postgresql
systemctl start postgresql

# Install Nginx for reverse proxy
yum install -y nginx
systemctl enable nginx

# Create application directory
mkdir -p /opt/laburemos
chown opc:opc /opt/laburemos

# Create logs directory
mkdir -p /var/log/laburemos
chown opc:opc /var/log/laburemos

# Configure firewall for web traffic
systemctl enable firewalld
systemctl start firewalld
firewall-cmd --zone=public --permanent --add-port=22/tcp
firewall-cmd --zone=public --permanent --add-port=80/tcp
firewall-cmd --zone=public --permanent --add-port=443/tcp
firewall-cmd --zone=public --permanent --add-port=3000/tcp
firewall-cmd --zone=public --permanent --add-port=3001/tcp
firewall-cmd --reload

# Install SSL certificates support
yum install -y certbot python3-certbot-nginx

# Setup log rotation
cat > /etc/logrotate.d/laburemos << EOF
/var/log/laburemos/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 opc opc
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Create systemd service for PM2
env PATH=$PATH:/usr/bin pm2 startup systemd -u opc --hp /home/opc

echo "LABUREMOS Cloud Setup Complete!"
echo "Next steps:"
echo "1. SSH to instance: ssh -i private_key opc@PUBLIC_IP"
echo "2. Clone repository to /opt/laburemos"
echo "3. Configure databases and environment variables"
echo "4. Deploy applications with PM2"
```

## 🔧 Post-Creation Configuration

### **Step 1: SSH Connection and Initial Setup**
```bash
# Connect to your instance
ssh -i ~/.ssh/laburemos-oci-key opc@<PUBLIC_IP>

# Verify system status
sudo systemctl status mysqld postgresql nginx firewalld

# Check available resources
free -h
df -h
lscpu
```

### **Step 2: Database Configuration**

#### MySQL Setup
```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Connect as root and create database
sudo mysql -u root -p

# MySQL Commands
CREATE DATABASE laburemos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'laburemos'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON laburemos_db.* TO 'laburemos'@'localhost';
FLUSH PRIVILEGES;

# Import your existing database
mysql -u laburemos -p laburemos_db < /path/to/your/database.sql
```

#### PostgreSQL Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# PostgreSQL Commands
CREATE DATABASE laburemos;
CREATE USER laburemos WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE laburemos TO laburemos;
\q

# Configure PostgreSQL for local connections
sudo vi /var/lib/pgsql/data/postgresql.conf
# Uncomment and modify: listen_addresses = 'localhost'

sudo vi /var/lib/pgsql/data/pg_hba.conf
# Add: local   laburemos    laburemos                     md5

sudo systemctl restart postgresql
```

### **Step 3: Application Deployment**

#### Clone and Setup Repository
```bash
# Navigate to application directory
cd /opt/laburemos

# Clone your repository (replace with your actual repo)
git clone https://github.com/yourusername/laburemos.git .

# Setup frontend
cd frontend
npm install
npm run build

# Setup backend  
cd ../backend
npm install
npm run build

# Copy environment files
cp .env.example .env.production
# Edit with your production values
vi .env.production
```

#### PM2 Process Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'laburemos-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/opt/laburemos/frontend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/laburemos/frontend-error.log',
      out_file: '/var/log/laburemos/frontend-out.log',
      log_file: '/var/log/laburemos/frontend-combined.log'
    },
    {
      name: 'laburemos-backend',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/opt/laburemos/backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/laburemos/backend-error.log',
      out_file: '/var/log/laburemos/backend-out.log',
      log_file: '/var/log/laburemos/backend-combined.log'
    }
  ]
};
```

#### Deploy Applications
```bash
# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u opc --hp /home/opc

# Check status
pm2 status
pm2 logs
```

### **Step 4: Nginx Reverse Proxy Configuration**
```nginx
# /etc/nginx/nginx.conf
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL configuration (after obtaining certificates)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Frontend (Next.js)
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
    }
    
    # API (NestJS)
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 💰 Cost Analysis and Optimization

### **Always Free Tier Resources**
```yaml
Compute (Per Month):
  ✅ VM.Standard.A1.Flex: 4 OCPUs, 24GB RAM
  ✅ 3,000 OCPU Hours (ARM-based)
  ✅ Perfect for LABUREMOS stack

Storage (Per Month):
  ✅ 200 GB Block Storage (Boot + Data volumes)
  ✅ 10 GB Object Storage (backups, static assets)

Networking (Per Month):
  ✅ 1 Network Load Balancer (10 Mbps)
  ✅ VCN and related networking resources
  ✅ 10 TB Outbound Data Transfer

Total Always Free Value: ~$200+/month
```

### **Cost Scaling Scenarios**
```yaml
Development Environment:
  Instance: 2 OCPUs, 12GB RAM
  Storage: 100GB total
  Estimated Cost: $0/month (Always Free)

Production Environment:
  Instance: 4 OCPUs, 24GB RAM  
  Storage: 300GB total
  Load Balancer: 100 Mbps
  Estimated Cost: $0-30/month

High-Traffic Production:
  Instance: 8 OCPUs, 48GB RAM
  Storage: 500GB total
  Load Balancer: 400 Mbps
  Estimated Cost: $80-120/month
```

### **Cost Optimization Strategies**
```yaml
Resource Management:
  ✅ Use ARM-based instances (better price/performance)
  ✅ Right-size instances based on actual usage
  ✅ Implement auto-scaling for traffic variations
  ✅ Use preemptible instances for dev/test

Storage Optimization:
  ✅ Use appropriate storage tiers (Standard vs Archive)
  ✅ Implement lifecycle policies for backups
  ✅ Regular cleanup of unused resources
  ✅ Compression for backups and logs

Monitoring:
  ✅ Set up cost alerts and budgets
  ✅ Regular resource utilization reviews
  ✅ Automated cost optimization recommendations
```

## 🔒 Security Implementation

### **Instance Security Hardening**

#### OS-Level Security
```bash
# Update system regularly
sudo yum update -y

# Configure fail2ban for intrusion prevention
sudo yum install -y epel-release
sudo yum install -y fail2ban

# Configure fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Disable root login via SSH
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Configure automatic security updates
sudo yum install -y yum-cron
sudo systemctl enable yum-cron
sudo systemctl start yum-cron
```

#### Application Security
```bash
# Set proper file permissions
chmod 750 /opt/laburemos
chown -R opc:opc /opt/laburemos

# Configure environment variables securely
echo "NODE_ENV=production" > /opt/laburemos/.env.production
echo "JWT_SECRET=$(openssl rand -base64 64)" >> /opt/laburemos/.env.production
chmod 600 /opt/laburemos/.env.production

# Setup log monitoring
sudo yum install -y logwatch
```

### **Network Security**

#### SSL/TLS Configuration
```bash
# Install Certbot for Let's Encrypt certificates
sudo yum install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Setup automatic renewal
echo "0 0,12 * * * root python3 -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null
```

#### Database Security
```bash
# MySQL Security
sudo mysql -u root -p
# Remove anonymous users, disable remote root login
# Set strong passwords for all database users

# PostgreSQL Security
sudo -u postgres psql
# Configure pg_hba.conf for secure authentication
# Use SSL connections for database access
```

### **Backup and Disaster Recovery**

#### Automated Backup Configuration
```bash
# Create backup script
cat > /opt/laburemos/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# MySQL Backup
mysqldump -u laburemos -p laburemos_db > $BACKUP_DIR/mysql_backup_$DATE.sql

# PostgreSQL Backup
sudo -u postgres pg_dump laburemos > $BACKUP_DIR/postgres_backup_$DATE.sql

# Application Files Backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/laburemos

# Upload to Object Storage (configure OCI CLI first)
# oci os object put -bn laburemos-backups --file $BACKUP_DIR/mysql_backup_$DATE.sql

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# Make backup script executable
chmod +x /opt/laburemos/scripts/backup.sh

# Schedule daily backups
echo "0 2 * * * /opt/laburemos/scripts/backup.sh >> /var/log/laburemos/backup.log 2>&1" | crontab -
```

## 📊 Monitoring and Observability

### **System Monitoring Setup**

#### Install Monitoring Tools
```bash
# Install Node Exporter for Prometheus metrics
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz
sudo cp node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin
sudo useradd -rs /bin/false node_exporter

# Create systemd service for Node Exporter
cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter
```

#### Application Performance Monitoring
```javascript
// Add to your Next.js and NestJS applications
// Install: npm install prom-client

// Prometheus metrics example
const promClient = require('prom-client');

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

// Database connection pool metrics
const dbPoolSize = new promClient.Gauge({
  name: 'database_pool_size',
  help: 'Current database pool size',
  labelNames: ['database']
});
```

### **Log Management**

#### Centralized Logging Configuration
```bash
# Install and configure rsyslog for centralized logging
sudo yum install -y rsyslog

# Configure log forwarding
cat >> /etc/rsyslog.conf << 'EOF'
# LABUREMOS Application Logs
$ModLoad imfile
$InputFileName /var/log/laburemos/frontend-combined.log
$InputFileTag frontend:
$InputFileStateFile stat-frontend
$InputFileSeverity info
$InputFileFacility local0
$InputRunFileMonitor

$InputFileName /var/log/laburemos/backend-combined.log
$InputFileTag backend:
$InputFileStateFile stat-backend
$InputFileSeverity info
$InputFileFacility local1
$InputRunFileMonitor
EOF

sudo systemctl restart rsyslog
```

## 🚦 Health Checks and Alerts

### **Health Check Endpoints**

#### Next.js Health Check
```javascript
// pages/api/health.js
export default function handler(req, res) {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: 'OK', // Implement actual DB check
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };
  
  try {
    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.message = error;
    res.status(503).json(healthcheck);
  }
}
```

#### NestJS Health Check
```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  check() {
    return this.health.check([
      () => this.http.pingCheck('frontend', 'http://localhost:3000'),
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

### **Alert Configuration**

#### System Alert Script
```bash
# Create alert script
cat > /opt/laburemos/scripts/alerts.sh << 'EOF'
#!/bin/bash

# Check disk usage
DISK_USAGE=$(df / | grep -vE '^Filesystem' | awk '{print $5}' | sed 's/%//g')
if [ $DISK_USAGE -gt 80 ]; then
    echo "HIGH DISK USAGE: ${DISK_USAGE}%" | mail -s "LABUREMOS Alert: High Disk Usage" admin@yourdomain.com
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
if (( $(echo "$MEMORY_USAGE > 85" | bc -l) )); then
    echo "HIGH MEMORY USAGE: ${MEMORY_USAGE}%" | mail -s "LABUREMOS Alert: High Memory Usage" admin@yourdomain.com
fi

# Check if applications are running
if ! pm2 list | grep -q "laburemos-frontend.*online"; then
    echo "Frontend application is down!" | mail -s "LABUREMOS Alert: Frontend Down" admin@yourdomain.com
fi

if ! pm2 list | grep -q "laburemos-backend.*online"; then
    echo "Backend application is down!" | mail -s "LABUREMOS Alert: Backend Down" admin@yourdomain.com
fi

# Check database connectivity
if ! mysqladmin ping -h localhost -u laburemos -p'your_password' &> /dev/null; then
    echo "MySQL database is not responding!" | mail -s "LABUREMOS Alert: MySQL Down" admin@yourdomain.com
fi
EOF

chmod +x /opt/laburemos/scripts/alerts.sh

# Schedule alerts every 5 minutes
echo "*/5 * * * * /opt/laburemos/scripts/alerts.sh" | crontab -
```

## 🔄 Deployment Automation

### **CI/CD Pipeline Integration**

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy-oci.yml
name: Deploy to Oracle Cloud

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd frontend && npm ci
        cd ../backend && npm ci
        
    - name: Build applications
      run: |
        cd frontend && npm run build
        cd ../backend && npm run build
        
    - name: Run tests
      run: |
        cd frontend && npm test
        cd ../backend && npm test
        
    - name: Deploy to OCI
      env:
        OCI_HOST: ${{ secrets.OCI_HOST }}
        OCI_USER: ${{ secrets.OCI_USER }}
        OCI_KEY: ${{ secrets.OCI_PRIVATE_KEY }}
      run: |
        echo "$OCI_KEY" > private_key
        chmod 600 private_key
        
        # Deploy frontend
        scp -i private_key -r frontend/dist $OCI_USER@$OCI_HOST:/opt/laburemos/frontend/
        
        # Deploy backend
        scp -i private_key -r backend/dist $OCI_USER@$OCI_HOST:/opt/laburemos/backend/
        
        # Restart applications
        ssh -i private_key $OCI_USER@$OCI_HOST "cd /opt/laburemos && pm2 restart all"
        
        rm private_key
```

### **Blue-Green Deployment Strategy**
```bash
# Create deployment script
cat > /opt/laburemos/scripts/deploy.sh << 'EOF'
#!/bin/bash

# Blue-Green Deployment Script for LABUREMOS
BLUE_DIR="/opt/laburemos-blue"
GREEN_DIR="/opt/laburemos-green"
CURRENT_LINK="/opt/laburemos-current"
NEW_VERSION_DIR="/opt/laburemos-staging"

# Determine current and target environments
if [ -L "$CURRENT_LINK" ]; then
    CURRENT_TARGET=$(readlink $CURRENT_LINK)
    if [ "$CURRENT_TARGET" == "$BLUE_DIR" ]; then
        TARGET_DIR="$GREEN_DIR"
        TARGET_COLOR="GREEN"
    else
        TARGET_DIR="$BLUE_DIR"
        TARGET_COLOR="BLUE"
    fi
else
    TARGET_DIR="$BLUE_DIR"
    TARGET_COLOR="BLUE"
fi

echo "Deploying to $TARGET_COLOR environment: $TARGET_DIR"

# Copy new version to target directory
cp -r $NEW_VERSION_DIR/* $TARGET_DIR/

# Install dependencies and build
cd $TARGET_DIR/frontend && npm ci && npm run build
cd $TARGET_DIR/backend && npm ci && npm run build

# Start applications in target environment
cd $TARGET_DIR
pm2 start ecosystem.config.js --name "laburemos-$TARGET_COLOR-frontend"
pm2 start ecosystem.config.js --name "laburemos-$TARGET_COLOR-backend"

# Health check
sleep 30
if curl -f http://localhost:3000/api/health && curl -f http://localhost:3001/health; then
    echo "Health check passed. Switching traffic to $TARGET_COLOR"
    
    # Update current symlink
    ln -sfn $TARGET_DIR $CURRENT_LINK
    
    # Stop old environment
    if [ "$TARGET_COLOR" == "BLUE" ]; then
        pm2 stop laburemos-GREEN-frontend laburemos-GREEN-backend
    else
        pm2 stop laburemos-BLUE-frontend laburemos-BLUE-backend
    fi
    
    echo "Deployment successful!"
else
    echo "Health check failed. Rolling back..."
    pm2 stop "laburemos-$TARGET_COLOR-frontend" "laburemos-$TARGET_COLOR-backend"
    exit 1
fi
EOF

chmod +x /opt/laburemos/scripts/deploy.sh
```

## 📚 Maintenance and Troubleshooting

### **Regular Maintenance Tasks**

#### Daily Maintenance Script
```bash
# Create maintenance script
cat > /opt/laburemos/scripts/maintenance.sh << 'EOF'
#!/bin/bash

# Daily maintenance tasks for LABUREMOS
LOG_FILE="/var/log/laburemos/maintenance.log"
echo "Starting daily maintenance: $(date)" >> $LOG_FILE

# Update system packages
sudo yum update -y >> $LOG_FILE 2>&1

# Clean up old log files
find /var/log/laburemos -name "*.log" -mtime +30 -delete

# Optimize databases
mysql -u laburemos -p'your_password' laburemos_db -e "OPTIMIZE TABLE users, projects, skills;" >> $LOG_FILE 2>&1
sudo -u postgres psql laburemos -c "VACUUM ANALYZE;" >> $LOG_FILE 2>&1

# Clear PM2 logs
pm2 flush

# Check disk space and clean if necessary
DISK_USAGE=$(df / | grep -vE '^Filesystem' | awk '{print $5}' | sed 's/%//g')
if [ $DISK_USAGE -gt 75 ]; then
    # Clean npm cache
    npm cache clean --force
    
    # Clean old backups
    find /opt/backups -name "*.sql" -mtime +7 -delete
    find /opt/backups -name "*.tar.gz" -mtime +7 -delete
    
    echo "Cleaned up disk space due to high usage: ${DISK_USAGE}%" >> $LOG_FILE
fi

# Restart applications if memory usage is high
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
if (( $(echo "$MEMORY_USAGE > 90" | bc -l) )); then
    pm2 restart all
    echo "Restarted applications due to high memory usage: ${MEMORY_USAGE}%" >> $LOG_FILE
fi

echo "Daily maintenance completed: $(date)" >> $LOG_FILE
EOF

chmod +x /opt/laburemos/scripts/maintenance.sh

# Schedule daily maintenance at 3 AM
echo "0 3 * * * /opt/laburemos/scripts/maintenance.sh" | crontab -
```

### **Troubleshooting Guide**

#### Common Issues and Solutions
```bash
# Issue 1: High CPU Usage
# Diagnosis
top -p $(pgrep -d, node)
pm2 monit

# Solution
pm2 restart all
# Consider scaling up OCPUs if persistent

# Issue 2: Database Connection Errors
# Diagnosis
sudo systemctl status mysqld postgresql
netstat -tlnp | grep :3306
netstat -tlnp | grep :5432

# Solution
sudo systemctl restart mysqld postgresql
# Check connection limits and optimize

# Issue 3: Memory Leaks
# Diagnosis
pm2 list
free -h
cat /proc/meminfo

# Solution
pm2 restart all
# Implement memory monitoring and alerts

# Issue 4: Disk Space Issues
# Diagnosis
df -h
du -sh /opt/laburemos/*
du -sh /var/log/*

# Solution
# Clean old logs, backups, and temporary files
find /tmp -type f -atime +7 -delete
```

#### Emergency Recovery Procedures
```bash
# Create emergency recovery script
cat > /opt/laburemos/scripts/emergency-recovery.sh << 'EOF'
#!/bin/bash

echo "=== LABUREMOS Emergency Recovery ==="
echo "Starting emergency recovery: $(date)"

# Stop all applications
pm2 stop all

# Check system resources
echo "=== System Resources ==="
free -h
df -h

# Check database status
echo "=== Database Status ==="
sudo systemctl status mysqld
sudo systemctl status postgresql

# Restart databases if needed
if ! systemctl is-active --quiet mysqld; then
    echo "Restarting MySQL..."
    sudo systemctl restart mysqld
fi

if ! systemctl is-active --quiet postgresql; then
    echo "Restarting PostgreSQL..."
    sudo systemctl restart postgresql
fi

# Restore from latest backup if databases are corrupted
if ! mysqladmin ping -h localhost -u laburemos -p'your_password' &> /dev/null; then
    echo "MySQL appears corrupted. Restoring from backup..."
    # Implement backup restoration logic
fi

# Restart applications with minimal configuration
echo "=== Restarting Applications ==="
cd /opt/laburemos
pm2 start ecosystem.config.js

# Wait for applications to start
sleep 30

# Health check
if curl -f http://localhost:3000/api/health && curl -f http://localhost:3001/health; then
    echo "Emergency recovery successful!"
    echo "Applications are responding normally."
else
    echo "Emergency recovery failed!"
    echo "Manual intervention required."
    exit 1
fi

echo "Emergency recovery completed: $(date)"
EOF

chmod +x /opt/laburemos/scripts/emergency-recovery.sh
```

## 📋 Migration Checklist

### **Pre-Migration Tasks**
- [ ] Create OCI account and configure billing
- [ ] Set up VCN and security groups
- [ ] Generate SSH key pairs
- [ ] Plan resource allocation and sizing
- [ ] Backup current local databases
- [ ] Document current environment configuration

### **Migration Tasks**
- [ ] Create compute instance with proper specifications
- [ ] Configure networking and security rules
- [ ] Install and configure required software
- [ ] Set up databases (MySQL and PostgreSQL)
- [ ] Deploy applications using PM2
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificates
- [ ] Implement monitoring and alerting
- [ ] Configure automated backups

### **Post-Migration Tasks**
- [ ] Verify all functionality works correctly
- [ ] Perform load testing
- [ ] Set up monitoring dashboards
- [ ] Document production procedures
- [ ] Train team on new environment
- [ ] Implement CI/CD pipeline
- [ ] Schedule regular maintenance tasks

### **Rollback Plan**
- [ ] Keep local environment functional during migration
- [ ] Document rollback procedures
- [ ] Test rollback process
- [ ] Maintain database synchronization during transition
- [ ] Plan DNS cutover strategy

## 🎯 Next Steps

### **Immediate Actions (Week 1)**
1. **Create OCI Account**: Set up billing and compartments
2. **Provision Infrastructure**: Create VCN, compute instance, and storage
3. **Basic Deployment**: Get applications running on OCI
4. **Security Configuration**: Implement basic security measures

### **Short-term Goals (Weeks 2-4)**
1. **Production Hardening**: Implement all security and monitoring features
2. **Performance Optimization**: Tune applications and databases
3. **Backup and Recovery**: Set up automated backups and test recovery
4. **Documentation**: Create operational runbooks

### **Long-term Objectives (Months 2-3)**
1. **High Availability**: Implement multi-AZ deployment
2. **Auto-scaling**: Configure load-based scaling
3. **Advanced Monitoring**: Set up comprehensive observability
4. **Disaster Recovery**: Implement cross-region backup strategy

---

**📄 Document Status**: Production Ready | **🔄 Last Updated**: 2025-07-30 | **📋 Version**: 1.0

**🔗 Related Documents**: 
- [CLAUDE.md](./CLAUDE.md) - Project overview and development guide
- [PROJECT-INDEX.md](./PROJECT-INDEX.md) - Complete project documentation index
- [docs/development/CLAUDE-ARCHITECTURE.md](./docs/development/CLAUDE-ARCHITECTURE.md) - System architecture details

**⚠️ Important Notes**:
- Always test configurations in development before production deployment
- Keep sensitive information (passwords, keys) in secure environment variables
- Regularly review and update security configurations
- Monitor costs and optimize resource usage continuously