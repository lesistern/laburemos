# Oracle Cloud Infrastructure - LABUREMOS Corrected Configuration Guide

**Professional Freelance Platform** | Next.js 15.4.4 + NestJS → Oracle Cloud Infrastructure (OCI)

## 🚨 Critical Configuration Corrections

Based on the provided configuration review, this document provides the **corrected step-by-step instructions** to properly configure your Oracle Cloud instance for the LABUREMOS platform.

## ❌ **Issues Found in Current Configuration**

### **Critical Issues**
```yaml
Problem 1 - Insufficient Resources:
  Current: 1 OCPU, 6GB RAM
  Required: 4 OCPUs, 24GB RAM
  Impact: Cannot run Next.js + NestJS + MySQL + PostgreSQL simultaneously

Problem 2 - OS Compatibility:
  Current: Oracle Linux 9
  Recommended: Oracle Linux 8
  Impact: Better Node.js support and stability
```

### **Resource Requirements Analysis**
```yaml
LABUREMOS Stack Memory Usage:
  Next.js Frontend (Port 3000): 2-4GB RAM
  NestJS Backend (Port 3001): 2-3GB RAM
  MySQL Database: 1-2GB RAM
  PostgreSQL Database: 1-2GB RAM
  Operating System: 1GB RAM
  Buffer/Overhead: 2GB RAM
  
Total Required: 8-14GB RAM minimum
Recommended: 24GB RAM for smooth operation
```

## ✅ **Corrected OCI Console Configuration**

### **Step 1: Basic Information**
```yaml
✓ Name: laburemos-prod-01
✓ Create in compartment: lesistern (root)
✓ Placement:
  - Availability domain: AD-1
  - Capacity type: on-demand
  - Fault domain: FD-1
```

### **Step 2: Image and Shape (CRITICAL CHANGES)**

#### **Image Configuration**
```yaml
CHANGE FROM:
  ❌ Operating system: Oracle Linux 9
  ❌ Image build: 2025.07.21-0

CHANGE TO:
  ✅ Operating system: Oracle Linux 8
  ✅ Image build: (Select latest available)
  ✅ Architecture: x86_64 or ARM (both work with A1.Flex)
```

#### **Shape Configuration (MOST IMPORTANT)**
```yaml
CHANGE FROM:
  ❌ Shape: VM.Standard.A1.Flex
  ❌ Shape build: 1 core OCPU, 6 GB memory, 1 Gbps network

CHANGE TO:
  ✅ Shape: VM.Standard.A1.Flex
  ✅ OCPUs: 4 (minimum 2 for development)
  ✅ Memory (GB): 24 (minimum 12 for development)
  ✅ Network bandwidth (Gbps): 4
  ✅ Always Free Eligible: YES (up to 4 OCPUs, 24GB)
```

### **Step 3: Networking (Already Correct)**
```yaml
Primary VNIC IP addresses:
  ✅ Virtual cloud network: laburemos-vcn
  ✅ Subnet: public subnet-laburemos-vcn
  ✅ Launch options: -
  ✅ DNS record: Yes
  ✅ Use network security groups: No (correct for now)
  ✅ Public IPv4 address: Yes
  ✅ Private IPv4 address: Automatically assigned on creation
```

### **Step 4: SSH Keys (Already Correct)**
```yaml
✅ SSH keys: ssh-rsa AAAAB3NzaC1yc2E... (configured correctly)
```

### **Step 5: Storage (Correct, Optional Enhancement)**
```yaml
Current Configuration (Acceptable):
  ✅ Boot volume: 50GB
  ✅ Boot volume performance (VPU): 10
  ✅ Use in-transit encryption: Enabled

Optional Enhancement for Production:
  📈 Boot volume: 100GB (more space for applications)
  📈 Boot volume performance (VPU): 20 (better I/O performance)
```

### **Step 6: Advanced Options Enhancement**

#### **Oracle Cloud Agent (Recommended Changes)**
```yaml
Current (Acceptable):
  ✅ Custom Logs Monitoring: Enabled
  ✅ Compute Instance Run Command: Enabled
  ✅ Compute Instance Monitoring: Enabled
  ✅ Cloud Guard Workload Protection: Enabled

Recommended to Enable:
  📈 OS Management Hub Agent: Enabled (for automatic updates)
  📈 Management Agent: Enabled (for enhanced monitoring)
  📈 Vulnerability Scanning: Enabled (security scanning)
```

## 🔧 **Exact Console Configuration Steps**

### **Step-by-Step Corrections**

#### **1. Image & Shape Section**
```bash
1. Click "Change Image" if already selected
   ✓ Browse All Images
   ✓ Operating System: Oracle Linux
   ✓ OS Version: 8 (not 9)
   ✓ Select latest build available

2. In Shape Section:
   ✓ Shape series: Ampere
   ✓ Shape: VM.Standard.A1.Flex
   ✓ Number of OCPUs: 4 (slide or type)
   ✓ Amount of memory (GB): 24 (slide or type)
   ✓ Network bandwidth (Gbps): Will auto-adjust to 4
```

#### **2. Verify Always Free Eligibility**
```yaml
After Changes, Verify:
  ✅ "Always Free eligible" badge appears
  ✅ Cost shows $0.00/month
  ✅ Resource limits: 4 OCPUs, 24GB (within free tier)
```

#### **3. Advanced Options (Optional but Recommended)**
```bash
Click "Show advanced options"

Management Tab:
  ✓ Oracle Cloud Agent → Enable recommended agents:
    - OS Management Hub Agent: ✅ 
    - Management Agent: ✅
    - Vulnerability Scanning: ✅

Cloud-init script (paste this):
```

#### **4. Cloud-Init Script for Oracle Linux 8**
```bash
#!/bin/bash
# LABUREMOS Platform Setup Script for Oracle Linux 8

# System Update
dnf update -y

# Install Node.js 18 LTS (required for Next.js 15.4.4)
dnf install -y nodejs npm

# Verify Node.js version
node --version
npm --version

# Install essential packages
dnf install -y git curl wget unzip vim htop htop-devel

# Install PM2 for process management
npm install -g pm2 @nestjs/cli

# Install and configure MySQL 8.0
dnf install -y mysql-server
systemctl enable mysqld
systemctl start mysqld

# Install and configure PostgreSQL 15
dnf install -y postgresql postgresql-server
postgresql-setup --initdb
systemctl enable postgresql
systemctl start postgresql

# Install Nginx for reverse proxy
dnf install -y nginx
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
dnf install -y certbot python3-certbot-nginx

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

# Configure system limits for Node.js applications
cat >> /etc/security/limits.conf << EOF
opc soft nofile 65536
opc hard nofile 65536
opc soft nproc 32768
opc hard nproc 32768
EOF

# Setup PM2 startup
sudo -u opc bash -c 'cd /home/opc && pm2 startup systemd -u opc --hp /home/opc'

echo "LABUREMOS Cloud Setup Complete!"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Next steps:"
echo "1. SSH to instance: ssh -i private_key opc@PUBLIC_IP"
echo "2. Clone repository to /opt/laburemos"
echo "3. Configure databases and environment variables"
echo "4. Deploy applications with PM2"
```

## 📋 **Pre-Creation Checklist**

### **Before Clicking "Create" - Verify:**
```yaml
✅ Shape: VM.Standard.A1.Flex with 4 OCPUs, 24GB RAM
✅ Image: Oracle Linux 8 (not 9)
✅ Network: laburemos-vcn with public subnet
✅ SSH Key: Properly configured
✅ Storage: 50GB+ boot volume
✅ Always Free: Badge visible, $0.00 cost
✅ Cloud-init: Script pasted in advanced options
```

## 🚀 **Post-Creation Immediate Steps**

### **Step 1: Initial Connection Test**
```bash
# Wait 5-10 minutes for instance to fully boot
# Find your public IP in OCI Console

# Test connection
ssh -i ~/.ssh/your-key opc@<PUBLIC_IP>

# If connection fails, check:
# 1. Security list allows port 22
# 2. Instance is in "Running" state
# 3. SSH key is correct
```

### **Step 2: Verify System Resources**
```bash
# Once connected, verify resources
free -h
# Should show ~24GB total memory

lscpu
# Should show 4 OCPUs

df -h
# Should show 50GB+ available space

# Check Node.js installation
node --version
# Should show v18.x.x or v20.x.x

npm --version
# Should show 9.x.x or 10.x.x
```

### **Step 3: Verify Services Status**
```bash
# Check database services
sudo systemctl status mysqld
sudo systemctl status postgresql

# Check firewall
sudo firewall-cmd --list-all

# Check if PM2 is ready
pm2 --version
```

## 💾 **Storage Configuration for Production**

### **Additional Block Volumes (Recommended for Production)**

After instance creation, add dedicated storage for databases:

```yaml
MySQL Data Volume:
  Name: laburemos-mysql-data
  Size: 200GB
  Performance: Higher Performance (20 VPUs)
  Mount: /var/lib/mysql

PostgreSQL Data Volume:
  Name: laburemos-postgres-data
  Size: 200GB
  Performance: Higher Performance (20 VPUs)
  Mount: /var/lib/postgresql

Application Data Volume:
  Name: laburemos-app-data
  Size: 100GB
  Performance: Balanced (10 VPUs)
  Mount: /opt/laburemos
```

### **Volume Creation Steps**
```bash
1. In OCI Console: Storage → Block Volumes → Create Block Volume
2. Configure each volume as specified above
3. Attach volumes to your instance
4. SSH to instance and mount volumes:

# Format and mount additional volumes
sudo mkfs.ext4 /dev/sdb  # MySQL volume
sudo mkfs.ext4 /dev/sdc  # PostgreSQL volume
sudo mkfs.ext4 /dev/sdd  # Application volume

# Create mount points
sudo mkdir -p /mnt/mysql-data
sudo mkdir -p /mnt/postgres-data
sudo mkdir -p /mnt/app-data

# Mount volumes
sudo mount /dev/sdb /mnt/mysql-data
sudo mount /dev/sdc /mnt/postgres-data
sudo mount /dev/sdd /mnt/app-data

# Add to /etc/fstab for persistent mounting
```

## 🔒 **Security Hardening (Post-Creation)**

### **Immediate Security Steps**
```bash
# 1. Update system
sudo dnf update -y

# 2. Configure fail2ban
sudo dnf install -y epel-release
sudo dnf install -y fail2ban

# 3. Secure SSH
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 4. Configure automatic security updates
sudo dnf install -y dnf-automatic
sudo systemctl enable --now dnf-automatic.timer
```

### **Database Security**
```bash
# Secure MySQL
sudo mysql_secure_installation

# Create LABUREMOS database and user
sudo mysql -u root -p << EOF
CREATE DATABASE laburemos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'laburemos'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON laburemos_db.* TO 'laburemos'@'localhost';
FLUSH PRIVILEGES;
EOF

# Secure PostgreSQL
sudo -u postgres psql << EOF
CREATE DATABASE laburemos;
CREATE USER laburemos WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE laburemos TO laburemos;
\q
EOF
```

## 📊 **Performance Optimization**

### **System Performance Tuning**
```bash
# Optimize for Node.js applications
cat >> /etc/sysctl.conf << EOF
# Network optimizations
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15

# File descriptor limits
fs.file-max = 2097152

# Memory management
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

# Apply settings
sudo sysctl -p
```

### **Database Performance Tuning**

#### **MySQL Configuration**
```bash
# Create MySQL configuration for LABUREMOS
sudo cat > /etc/my.cnf.d/laburemos.cnf << EOF
[mysqld]
# Performance tuning for 24GB RAM system
innodb_buffer_pool_size = 8G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connection limits
max_connections = 1000
max_connect_errors = 100000

# Query cache (if using MySQL 5.7)
query_cache_type = 1
query_cache_size = 256M

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
EOF

sudo systemctl restart mysqld
```

#### **PostgreSQL Configuration**
```bash
# Edit PostgreSQL configuration
sudo -u postgres cp /var/lib/pgsql/data/postgresql.conf /var/lib/pgsql/data/postgresql.conf.backup

# Optimize for 24GB RAM system
sudo -u postgres cat >> /var/lib/pgsql/data/postgresql.conf << EOF
# Memory settings for 24GB RAM
shared_buffers = 6GB
effective_cache_size = 18GB
work_mem = 256MB
maintenance_work_mem = 1GB

# Connection settings
max_connections = 200

# Performance settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_min_duration_statement = 1000
EOF

sudo systemctl restart postgresql
```

## 🚦 **Application Deployment Guide**

### **Step 1: Clone and Setup Repository**
```bash
# Connect to your instance
ssh -i ~/.ssh/your-key opc@<PUBLIC_IP>

# Clone your repository
cd /opt/laburemos
git clone https://github.com/yourusername/laburemos.git .

# Or if repository is private, set up SSH key for git
```

### **Step 2: Environment Configuration**
```bash
# Frontend environment
cd /opt/laburemos/frontend
cp .env.example .env.production

# Edit production environment
cat > .env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
DATABASE_URL=mysql://laburemos:secure_password_here@localhost:3306/laburemos_db
EOF

# Backend environment
cd /opt/laburemos/backend
cp .env.example .env.production

cat > .env.production << EOF
NODE_ENV=production
PORT=3001
JWT_SECRET=$(openssl rand -base64 64)
DATABASE_URL=postgresql://laburemos:secure_password_here@localhost:5432/laburemos
MYSQL_URL=mysql://laburemos:secure_password_here@localhost:3306/laburemos_db
EOF

# Secure environment files
chmod 600 /opt/laburemos/frontend/.env.production
chmod 600 /opt/laburemos/backend/.env.production
```

### **Step 3: Install Dependencies and Build**
```bash
# Frontend setup
cd /opt/laburemos/frontend
npm ci
npm run build

# Backend setup
cd /opt/laburemos/backend
npm ci
npm run build

# Database migration (if using Prisma)
npx prisma generate
npx prisma migrate deploy
```

### **Step 4: PM2 Process Configuration**
```javascript
// /opt/laburemos/ecosystem.config.js
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
      max_memory_restart: '4G',
      error_file: '/var/log/laburemos/frontend-error.log',
      out_file: '/var/log/laburemos/frontend-out.log',
      log_file: '/var/log/laburemos/frontend-combined.log',
      time: true
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
      max_memory_restart: '4G',
      error_file: '/var/log/laburemos/backend-error.log',
      out_file: '/var/log/laburemos/backend-out.log',
      log_file: '/var/log/laburemos/backend-combined.log',
      time: true
    }
  ]
};
```

### **Step 5: Deploy Applications**
```bash
# Start applications
cd /opt/laburemos
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by PM2

# Check status
pm2 status
pm2 logs
pm2 monit
```

## 🌐 **Nginx Reverse Proxy Configuration**

### **Nginx Setup**
```bash
# Create Nginx configuration
sudo cat > /etc/nginx/conf.d/laburemos.conf << 'EOF'
# HTTP server - redirect to HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL configuration (configure after obtaining certificates)
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
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
}
EOF

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 📈 **Monitoring and Alerts Setup**

### **System Monitoring**
```bash
# Create monitoring script
cat > /opt/laburemos/scripts/monitor.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/laburemos/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# System metrics
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
MEM_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
DISK_USAGE=$(df / | grep -vE '^Filesystem' | awk '{print $5}' | sed 's/%//g')

# Application status
FRONTEND_STATUS=$(pm2 jlist | jq '.[] | select(.name=="laburemos-frontend") | .pm2_env.status' | tr -d '"')
BACKEND_STATUS=$(pm2 jlist | jq '.[] | select(.name=="laburemos-backend") | .pm2_env.status' | tr -d '"')

# Database status
MYSQL_STATUS=$(systemctl is-active mysqld)
POSTGRES_STATUS=$(systemctl is-active postgresql)

# Log metrics
echo "[$DATE] CPU: ${CPU_USAGE}% | Memory: ${MEM_USAGE}% | Disk: ${DISK_USAGE}% | Frontend: $FRONTEND_STATUS | Backend: $BACKEND_STATUS | MySQL: $MYSQL_STATUS | PostgreSQL: $POSTGRES_STATUS" >> $LOG_FILE

# Alerts
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "[$DATE] ALERT: High CPU usage: ${CPU_USAGE}%" >> $LOG_FILE
fi

if (( $(echo "$MEM_USAGE > 85" | bc -l) )); then
    echo "[$DATE] ALERT: High memory usage: ${MEM_USAGE}%" >> $LOG_FILE
fi

if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] ALERT: High disk usage: ${DISK_USAGE}%" >> $LOG_FILE
fi

if [ "$FRONTEND_STATUS" != "online" ]; then
    echo "[$DATE] ALERT: Frontend application is $FRONTEND_STATUS" >> $LOG_FILE
    pm2 restart laburemos-frontend
fi

if [ "$BACKEND_STATUS" != "online" ]; then
    echo "[$DATE] ALERT: Backend application is $BACKEND_STATUS" >> $LOG_FILE
    pm2 restart laburemos-backend
fi
EOF

chmod +x /opt/laburemos/scripts/monitor.sh

# Schedule monitoring every 5 minutes
echo "*/5 * * * * /opt/laburemos/scripts/monitor.sh" | crontab -
```

## 🔄 **Backup Strategy**

### **Automated Backup Script**
```bash
# Create backup script
mkdir -p /opt/laburemos/scripts
cat > /opt/laburemos/scripts/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Starting backup process: $DATE"

# MySQL backup
mysqldump -u laburemos -p'secure_password_here' --single-transaction --routines --triggers laburemos_db > $BACKUP_DIR/mysql_backup_$DATE.sql

# PostgreSQL backup
sudo -u postgres pg_dump laburemos > $BACKUP_DIR/postgres_backup_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/laburemos --exclude=/opt/laburemos/node_modules

# Configuration backup
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz /etc/nginx /etc/systemd/system/pm2* /home/opc/.pm2

# Cleanup old backups
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "Backup completed: $DATE" >> /var/log/laburemos/backup.log
echo "Files created:"
ls -la $BACKUP_DIR/*_$DATE.* >> /var/log/laburemos/backup.log

# Optional: Upload to Object Storage
# Configure OCI CLI first, then uncomment:
# oci os object put -bn laburemos-backups --file $BACKUP_DIR/mysql_backup_$DATE.sql
# oci os object put -bn laburemos-backups --file $BACKUP_DIR/postgres_backup_$DATE.sql
# oci os object put -bn laburemos-backups --file $BACKUP_DIR/app_backup_$DATE.tar.gz
EOF

chmod +x /opt/laburemos/scripts/backup.sh

# Schedule daily backups at 2 AM
echo "0 2 * * * /opt/laburemos/scripts/backup.sh" | crontab -
```

## 🎯 **Final Verification Checklist**

### **After Complete Setup**
```bash
# 1. Check system resources
free -h && lscpu

# 2. Check all services
systemctl status mysqld postgresql nginx
pm2 status

# 3. Check application response
curl http://localhost:3000
curl http://localhost:3001/api/health

# 4. Check database connectivity
mysql -u laburemos -p'secure_password_here' laburemos_db -e "SELECT 1;"
sudo -u postgres psql laburemos -c "SELECT 1;"

# 5. Check logs
tail -f /var/log/laburemos/frontend-combined.log
tail -f /var/log/laburemos/backend-combined.log

# 6. Performance test
pm2 monit
htop
```

### **Success Criteria**
```yaml
✅ Instance running with 4 OCPUs, 24GB RAM
✅ Oracle Linux 8 with Node.js 18+
✅ MySQL and PostgreSQL databases operational
✅ Next.js frontend accessible on port 3000
✅ NestJS backend accessible on port 3001
✅ PM2 managing application processes
✅ Nginx reverse proxy configured
✅ Firewall allowing necessary ports
✅ Monitoring and backup scripts scheduled
✅ SSL certificates ready for domain setup
```

## 📞 **Support and Troubleshooting**

### **Common Issues and Solutions**

#### **Issue: Instance won't start**
```bash
# Check instance logs in OCI Console
# Verify cloud-init script syntax
# Check resource limits in compartment
```

#### **Issue: Applications won't start**
```bash
# Check Node.js version
node --version

# Check application logs  
pm2 logs

# Check database connectivity
sudo systemctl status mysqld postgresql
```

#### **Issue: High memory usage**
```bash
# Check process memory usage
ps aux --sort=-%mem | head

# Restart applications if needed
pm2 restart all

# Consider adding swap if needed
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### **Issue: Database connection errors**
```bash
# Check database service status
sudo systemctl status mysqld postgresql

# Check database logs
sudo tail -f /var/log/mysqld.log
sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log

# Restart database services
sudo systemctl restart mysqld postgresql
```

### **Performance Optimization Tips**
```yaml
Memory Optimization:
  - Monitor PM2 memory usage with pm2 monit
  - Set max_memory_restart in PM2 config
  - Use Node.js --max-old-space-size flag if needed

Database Optimization:
  - Monitor slow query logs
  - Optimize database configurations based on usage
  - Consider connection pooling

Application Optimization:
  - Enable Next.js production optimizations
  - Use CDN for static assets
  - Implement caching strategies
```

---

**📄 Document Status**: Production Ready Configuration Guide | **🔄 Last Updated**: 2025-07-30 | **📋 Version**: 2.0

**🔗 Related Documents**: 
- [cloud-oracle.md](./cloud-oracle.md) - Original comprehensive guide
- [CLAUDE.md](./CLAUDE.md) - Project overview and development guide
- [PROJECT-INDEX.md](./PROJECT-INDEX.md) - Complete project documentation index

**⚠️ Critical Reminders**:
- **MUST CHANGE**: Shape to 4 OCPUs, 24GB RAM before creating instance
- **MUST CHANGE**: Image to Oracle Linux 8 (not 9) for better compatibility
- **VERIFY**: Always Free eligibility shows $0.00 cost
- **TEST**: SSH connection immediately after instance creation
- **SECURE**: Change default passwords and configure SSL certificates