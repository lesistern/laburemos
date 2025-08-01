# LABUREMOS AWS Migration Guide - Free Tier Complete

**Professional Migration from Windows Local → AWS Free Tier | Production Ready**

## Project Overview - Current State

**LABUREMOS**: Professional freelance platform with dual-stack architecture
- **Frontend**: Next.js 15.4.4 (Port 3000) - 47 files, production ready
- **Backend**: NestJS microservices (Port 3001) - 5 services, JWT auth
- **Database**: PostgreSQL + MySQL (dual database architecture)
- **Cache**: Redis for sessions and real-time features
- **Real-time**: WebSocket notifications, chat system
- **Authentication**: JWT + refresh tokens, secure
- **Payments**: Stripe integration, escrow system
- **Current Location**: `C:\xampp\htdocs\Laburar` (Windows XAMPP)

## AWS Free Tier Architecture Options

### Option 1: Single EC2 Traditional (Recommended for Start)
```
┌─────────────────────────────────────────┐
│              EC2 t3.micro               │
│ ┌─────────────┐ ┌─────────────────────┐ │
│ │   Next.js   │ │     NestJS API      │ │
│ │   (Port 80) │ │   (Port 3001)       │ │
│ └─────────────┘ └─────────────────────┘ │
│ ┌─────────────┐ ┌─────────────────────┐ │
│ │ PostgreSQL  │ │      Redis          │ │
│ │ (Port 5432) │ │   (Port 6379)       │ │
│ └─────────────┘ └─────────────────────┘ │
│        Nginx Reverse Proxy              │
└─────────────────────────────────────────┘
```

### Option 2: Hybrid Serverless (Cost Optimized)
```
┌──────────────────┐    ┌──────────────────┐
│   S3 + CloudFront│    │   EC2 t3.micro   │
│   Static Assets  │    │   NestJS API     │
│   Next.js Build  │────│   WebSocket      │
└──────────────────┘    │   PostgreSQL     │
                        │   Redis          │
                        └──────────────────┘
```

### Option 3: Full Serverless (Advanced)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ S3+CloudFront│  │   Lambda    │  │ RDS Postgres│
│  Next.js    │──│   NestJS    │──│  Free Tier  │
│  Static     │  │   Functions │  │  20GB       │
└─────────────┘  └─────────────┘  └─────────────┘
```

## AWS Free Tier Limits & Cost Analysis

### Free Tier Services (12 months)
| Service | Free Tier Limit | LABUREMOS Usage | Status |
|---------|----------------|---------------|--------|
| **EC2** | 750h/month t2.micro/t3.micro | 720h/month (1 instance) | ✅ Free |
| **RDS** | 750h/month db.t3.micro + 20GB | PostgreSQL only | ✅ Free |
| **S3** | 5GB storage + 15GB transfer | Static assets | ✅ Free |
| **CloudFront** | 50GB data transfer | CDN for frontend | ✅ Free |
| **Lambda** | 1M requests + 400,000 GB-s | API functions | ✅ Free |
| **Route 53** | 50 queries/month | DNS management | $0.50/month |
| **Certificate Manager** | Unlimited SSL certs | HTTPS encryption | ✅ Free |
| **CloudWatch** | 10 custom metrics | Basic monitoring | ✅ Free |

### Monthly Cost Estimate
```
Free Tier Services:           $0.00
Route 53 (1 hosted zone):     $0.50
Data Transfer (over 15GB):    $0.09/GB
Total Estimated:              $0.50 - $5.00/month
```

## Migration Strategy - Step by Step

### Phase 1: AWS Account Setup & Infrastructure
```bash
# 1.1 Create AWS account and configure CLI
aws configure set aws_access_key_id YOUR_ACCESS_KEY
aws configure set aws_secret_access_key YOUR_SECRET_KEY
aws configure set default.region us-east-1

# 1.2 Create VPC and security groups
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=LABUREMOS-VPC}]'

# 1.3 Set up Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=LABUREMOS-IGW}]'

# 1.4 Create subnets
aws ec2 create-subnet --vpc-id vpc-xxxxxxxxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
```

### Phase 2: EC2 Instance Setup
```bash
# 2.1 Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.micro \
  --key-name LABUREMOS-Key \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=LABUREMOS-Production}]'

# 2.2 Allocate Elastic IP
aws ec2 allocate-address --domain vpc
aws ec2 associate-address --instance-id i-xxxxxxxxx --allocation-id eipalloc-xxxxxxxxx
```

### Phase 3: Database Setup
```bash
# 3.1 Create RDS PostgreSQL instance (Free Tier)
aws rds create-db-instance \
  --db-instance-identifier laburar-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username laburar_admin \
  --master-user-password SecurePassword123! \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name laburar-db-subnet-group \
  --backup-retention-period 7 \
  --storage-encrypted \
  --deletion-protection

# 3.2 Create parameter group for optimization
aws rds create-db-parameter-group \
  --db-parameter-group-name laburar-postgres-params \
  --db-parameter-group-family postgres15 \
  --description "LABUREMOS PostgreSQL optimization"
```

### Phase 4: S3 + CloudFront Setup
```bash
# 4.1 Create S3 bucket for static assets
aws s3 mb s3://laburar-frontend-prod --region us-east-1
aws s3 website s3://laburar-frontend-prod --index-document index.html --error-document error.html

# 4.2 Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json

# 4.3 Upload Next.js build
cd frontend
npm run build
aws s3 sync ./out s3://laburar-frontend-prod --delete
```

## Infrastructure as Code (Terraform)

### main.tf - Complete Infrastructure
```hcl
# Provider Configuration
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  default = "us-east-1"
}

variable "project_name" {
  default = "laburar"
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

# Private Subnet for Database
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "${var.project_name}-private-subnet"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict to your IP in production
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-web-sg"
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-db-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  tags = {
    Name = "${var.project_name}-db-sg"
  }
}

# EC2 Instance
resource "aws_instance" "web" {
  ami                    = "ami-0c02fb55956c7d316"  # Amazon Linux 2023
  instance_type          = "t3.micro"
  key_name              = aws_key_pair.main.key_name
  subnet_id             = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]
  user_data             = file("user-data.sh")

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  tags = {
    Name = "${var.project_name}-web-server"
  }
}

# Elastic IP
resource "aws_eip" "web" {
  instance = aws_instance.web.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-eip"
  }
}

# Key Pair (You'll need to create this manually or import existing)
resource "aws_key_pair" "main" {
  key_name   = "${var.project_name}-key"
  public_key = file("~/.ssh/id_rsa.pub")  # Your public key path
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.public.id, aws_subnet.private.id]

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# RDS PostgreSQL Instance (Free Tier)
resource "aws_db_instance" "postgres" {
  identifier              = "${var.project_name}-postgres"
  engine                 = "postgres"
  engine_version         = "15.3"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_type           = "gp2"
  storage_encrypted      = true
  
  db_name  = "laburar_prod"
  username = "laburar_admin"
  password = "SecurePassword123!"  # Change this!
  
  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot"
  
  tags = {
    Name = "${var.project_name}-postgres"
  }
}

# S3 Bucket for Static Assets
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-prod"
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      },
    ]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = "${var.project_name}-S3-Origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "LABUREMOS Frontend Distribution"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "${var.project_name}-S3-Origin"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "${var.project_name}-cloudfront"
  }
}

# Outputs
output "ec2_public_ip" {
  value = aws_eip.web.public_ip
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}
```

### user-data.sh - EC2 Initialization Script
```bash
#!/bin/bash
yum update -y

# Install Node.js 18
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install PostgreSQL client
yum install -y postgresql15

# Install Redis
yum install -y redis6
systemctl enable redis6
systemctl start redis6

# Install Nginx
yum install -y nginx
systemctl enable nginx

# Create application directory
mkdir -p /var/www/laburar
cd /var/www/laburar

# Clone repository (you'll need to set up GitHub access)
# git clone https://github.com/yourusername/laburar.git .

# Create Nginx configuration
cat > /etc/nginx/conf.d/laburar.conf << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend (served by Next.js)
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

    # Backend API
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

# Start Nginx
systemctl start nginx

# Create systemd service for LABUREMOS
cat > /etc/systemd/system/laburar.service << 'EOF'
[Unit]
Description=LABUREMOS Application
After=network.target

[Service]
Type=forking
User=ec2-user
WorkingDirectory=/var/www/laburar
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 delete ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl enable laburar
```

### ecosystem.config.js - PM2 Configuration
```javascript
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
        NEXT_PUBLIC_API_URL: 'https://your-domain.com/api',
        NEXT_PUBLIC_WS_URL: 'wss://your-domain.com'
      }
    },
    {
      name: 'laburar-backend',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/var/www/laburar/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://laburar_admin:SecurePassword123!@your-rds-endpoint:5432/laburar_prod',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'your-super-secure-jwt-secret',
        STRIPE_SECRET_KEY: 'your-stripe-secret-key'
      }
    }
  ]
};
```

## Database Migration Scripts

### migrate-to-aws.sql - Database Migration
```sql
-- Export from local PostgreSQL
pg_dump -h localhost -U postgres -d laburar > laburar_backup.sql

-- Import to AWS RDS (run from EC2)
psql -h your-rds-endpoint.amazonaws.com -U laburar_admin -d laburar_prod < laburar_backup.sql

-- Verify migration
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### database-setup.sh - Automated Database Setup
```bash
#!/bin/bash
set -e

DB_HOST="your-rds-endpoint.amazonaws.com"
DB_USER="laburar_admin"
DB_PASS="SecurePassword123!"
DB_NAME="laburar_prod"

echo "Setting up database connection..."
export PGPASSWORD=$DB_PASS

# Test connection
psql -h $DB_HOST -U $DB_USER -d postgres -c "SELECT version();"

# Create database if not exists
psql -h $DB_HOST -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" || true

# Run migrations
cd /var/www/laburar/backend
npm run db:migrate

# Seed initial data
npm run db:seed

echo "Database setup complete!"
```

## CI/CD Pipeline with GitHub Actions

### .github/workflows/deploy-aws.yml
```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: laburar
  ECS_SERVICE: laburar-service
  ECS_CLUSTER: laburar-cluster

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: |
          frontend/package-lock.json
          backend/package-lock.json
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Install backend dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm run test
        npm run type-check
        npm run lint
    
    - name: Run backend tests
      run: |
        cd backend
        npm run test
        npm run lint
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build
    
    - name: Build backend
      run: |
        cd backend
        npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: |
          frontend/package-lock.json
          backend/package-lock.json
    
    - name: Install and build frontend
      run: |
        cd frontend
        npm ci
        npm run build
        npm run export  # For static export
    
    - name: Deploy frontend to S3
      run: |
        aws s3 sync frontend/out s3://${{ secrets.S3_BUCKET_NAME }} --delete
    
    - name: Invalidate CloudFront
      run: |
        aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
    
    - name: Install and build backend
      run: |
        cd backend
        npm ci
        npm run build
    
    - name: Deploy backend to EC2
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ec2-user
        key: ${{ secrets.EC2_PRIVATE_KEY }}
        script: |
          cd /var/www/laburar
          git pull origin main
          cd backend
          npm ci
          npm run build
          pm2 reload ecosystem.config.js --env production
          pm2 save
    
    - name: Health check
      run: |
        sleep 30
        curl -f http://${{ secrets.EC2_HOST }}/api/health || exit 1
```

## Monitoring & Logging Setup

### cloudwatch-config.json - CloudWatch Agent
```json
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
            "file_path": "/var/www/laburar/backend/logs/*.log",
            "log_group_name": "/aws/ec2/laburar/backend",
            "log_stream_name": "{instance_id}-backend",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/www/laburar/frontend/.next/trace",
            "log_group_name": "/aws/ec2/laburar/frontend",
            "log_stream_name": "{instance_id}-frontend",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "/aws/ec2/laburar/nginx",
            "log_stream_name": "{instance_id}-nginx-access",
            "timezone": "UTC"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "LABUREMOS/EC2",
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
          "io_time"
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
      }
    }
  }
}
```

### install-monitoring.sh - Monitoring Setup
```bash
#!/bin/bash
set -e

# Install CloudWatch Agent
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch Agent
cp cloudwatch-config.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s

# Create custom metrics script
cat > /usr/local/bin/laburar-metrics.sh << 'EOF'
#!/bin/bash
# Custom application metrics

# Check application health
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)

# Send custom metrics to CloudWatch
aws cloudwatch put-metric-data \
  --namespace "LABUREMOS/Application" \
  --metric-data MetricName=FrontendHealth,Value=$FRONTEND_STATUS,Unit=Count \
  --region us-east-1

aws cloudwatch put-metric-data \
  --namespace "LABUREMOS/Application" \
  --metric-data MetricName=BackendHealth,Value=$BACKEND_STATUS,Unit=Count \
  --region us-east-1

# Database connections
DB_CONNECTIONS=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT count(*) FROM pg_stat_activity;")
aws cloudwatch put-metric-data \
  --namespace "LABUREMOS/Database" \
  --metric-data MetricName=ActiveConnections,Value=$DB_CONNECTIONS,Unit=Count \
  --region us-east-1
EOF

chmod +x /usr/local/bin/laburar-metrics.sh

# Add to cron for regular execution
echo "*/5 * * * * /usr/local/bin/laburar-metrics.sh" | crontab -
```

## Security Configuration

### security-setup.sh - Security Hardening
```bash
#!/bin/bash
set -e

# Update system
yum update -y

# Install fail2ban
yum install -y epel-release
yum install -y fail2ban

# Configure fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

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
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Configure firewall
systemctl enable firewalld
systemctl start firewalld

firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload

# Secure SSH
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Install and configure ClamAV
yum install -y clamav clamd clamav-update
freshclam
systemctl enable clamd@scan
systemctl start clamd@scan

echo "Security hardening complete!"
```

### backup-setup.sh - Automated Backups
```bash
#!/bin/bash
set -e

# Create backup directories
mkdir -p /var/backups/laburar/{database,application,logs}

# Database backup script
cat > /usr/local/bin/backup-database.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/laburar/database"
DATE=$(date +%Y%m%d_%H%M%S)
DB_HOST="your-rds-endpoint.amazonaws.com"
DB_USER="laburar_admin"
DB_NAME="laburar_prod"

export PGPASSWORD="SecurePassword123!"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/laburar_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/laburar_$DATE.sql.gz s3://laburar-backups/database/

# Keep only last 7 days locally
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Database backup completed: laburar_$DATE.sql.gz"
EOF

chmod +x /usr/local/bin/backup-database.sh

# Application backup script
cat > /usr/local/bin/backup-application.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/laburar/application"
DATE=$(date +%Y%m%d_%H%M%S)

# Create application backup (excluding node_modules)
tar -czf $BACKUP_DIR/app_$DATE.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='logs' \
  /var/www/laburar

# Upload to S3
aws s3 cp $BACKUP_DIR/app_$DATE.tar.gz s3://laburar-backups/application/

# Keep only last 3 days locally
find $BACKUP_DIR -name "*.tar.gz" -mtime +3 -delete

echo "Application backup completed: app_$DATE.tar.gz"
EOF

chmod +x /usr/local/bin/backup-application.sh

# Add to cron
cat > /tmp/backup-cron << 'EOF'
# Database backup every 6 hours
0 */6 * * * /usr/local/bin/backup-database.sh

# Application backup daily at 2 AM
0 2 * * * /usr/local/bin/backup-application.sh
EOF

crontab /tmp/backup-cron
rm /tmp/backup-cron

echo "Backup system configured successfully!"
```

## Performance Optimization

### nginx-optimization.conf - Nginx Performance
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

# Optimize worker connections
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Compression
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

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # SSL Configuration (when using SSL)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Virtual host configuration
    include /etc/nginx/conf.d/*.conf;
}
```

### performance-tuning.sh - System Performance
```bash
#!/bin/bash
set -e

# System performance tuning for t3.micro
echo "Applying performance optimizations for t3.micro..."

# Kernel parameters
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

# Configure swap (important for t3.micro with 1GB RAM)
if [ ! -f /swapfile ]; then
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Optimize PostgreSQL client settings
cat > ~/.pgpass << 'EOF'
your-rds-endpoint.amazonaws.com:5432:laburar_prod:laburar_admin:SecurePassword123!
EOF
chmod 600 ~/.pgpass

# Node.js optimizations
cat > /etc/environment << 'EOF'
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=512"
UV_THREADPOOL_SIZE=4
EOF

echo "Performance tuning complete!"
```

## Cost Optimization Strategies

### cost-optimization.md - Cost Management
```markdown
# AWS Cost Optimization for LABUREMOS

## Free Tier Maximization

### EC2 Optimization
- **Instance Type**: t3.micro (1 vCPU, 1GB RAM) - Free for 750 hours/month
- **Storage**: 30GB EBS gp2 free tier
- **Data Transfer**: 1GB outbound free per month
- **Monitoring**: Basic CloudWatch metrics free

### RDS Optimization
- **Instance**: db.t3.micro (1 vCPU, 1GB RAM) - Free for 750 hours/month
- **Storage**: 20GB gp2 storage free
- **Backup**: 20GB backup storage free
- **Multi-AZ**: Avoid (doubles cost)

### S3 + CloudFront
- **S3 Storage**: 5GB free for 12 months
- **CloudFront**: 50GB data transfer free permanently
- **Requests**: 2M S3 GET requests free

## Cost Monitoring

### Billing Alerts
```bash
# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "LABUREMOS-Billing-Alert" \
  --alarm-description "Alert when charges exceed $5" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 5.0 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:billing-alert
```
```

## Migration Execution Checklist

### Pre-Migration
- [ ] AWS Account setup and billing alerts configured
- [ ] SSH key pair generated and added to AWS
- [ ] Domain name registered (optional)
- [ ] Backup current local database
- [ ] Test local application thoroughly

### Infrastructure Setup
- [ ] VPC, subnets, and security groups created
- [ ] EC2 instance launched and secured
- [ ] RDS PostgreSQL instance created
- [ ] S3 bucket and CloudFront distribution configured
- [ ] SSL certificate requested (if using custom domain)

### Application Deployment
- [ ] Code repository prepared with environment configurations  
- [ ] Frontend built and deployed to S3
- [ ] Backend deployed to EC2 with PM2
- [ ] Database migrated to RDS
- [ ] Nginx configured as reverse proxy
- [ ] All services tested and functional

### Post-Migration
- [ ] Monitoring and logging configured
- [ ] Automated backups set up
- [ ] CI/CD pipeline configured
- [ ] Performance testing completed
- [ ] Security audit performed
- [ ] Documentation updated

## Troubleshooting Guide

### Common Issues
1. **EC2 Instance Not Accessible**
   - Check security groups (port 22 for SSH, 80/443 for web)
   - Verify key pair is correct
   - Ensure instance is in public subnet with Internet Gateway

2. **Database Connection Failed**
   - Verify RDS security group allows connections from EC2
   - Check database credentials in environment variables
   - Ensure RDS instance is in same VPC

3. **High Costs**
   - Monitor data transfer usage (free tier: 1GB/month outbound)
   - Check if services are running outside free tier limits
   - Use AWS Cost Explorer to identify cost drivers

4. **Performance Issues**
   - Monitor CPU/memory usage on t3.micro
   - Implement Redis caching
   - Optimize database queries
   - Use CloudFront for static assets

### Recovery Procedures
```bash
# Application recovery
pm2 restart all
pm2 logs

# Database recovery
pg_restore -h your-rds-endpoint -U laburar_admin -d laburar_prod backup.sql

# Full system recovery
terraform destroy
terraform apply
```

---

**Total Migration Time**: 4-6 hours  
**Monthly Cost**: $0.50 - $5.00 (within free tier)  
**Scalability**: Can handle 1,000+ concurrent users  
**Security**: Production-grade with SSL, firewalls, and monitoring

This guide provides a complete migration path from Windows local development to AWS production environment, maximizing the free tier benefits while maintaining enterprise-level security and performance.