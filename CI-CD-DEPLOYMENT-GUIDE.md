# 🚀 LABUREMOS CI/CD Complete Deployment Guide

## Overview

This comprehensive CI/CD system provides **zero-downtime deployments**, **automatic rollback**, **real-time monitoring**, and **enterprise-level security** for the LABUREMOS platform.

## 🎯 Quick Start

### 1. One-Command Setup
```bash
# Configure all GitHub Secrets automatically
./setup-github-secrets.sh laburemos/platform

# Deploy monitoring infrastructure
aws cloudformation deploy \
  --template-file monitoring/alerts.yml \
  --stack-name laburemos-monitoring \
  --parameter-overrides Environment=production \
  --capabilities CAPABILITY_IAM

# Make scripts executable
chmod +x deploy.sh setup-github-secrets.sh
```

### 2. Deploy to Production
```bash
# Full production deployment
./deploy.sh production

# Quick deployment without tests
./deploy.sh production --skip-tests

# Emergency rollback
./deploy.sh production --rollback
```

## 📋 System Components

### 🔄 Automated Deployment Pipeline
- **Zero-downtime** deployments with health checks
- **Automatic rollback** on failure detection
- **Backup management** with 10-version retention
- **Multi-environment** support (staging/production)

### 🧪 Testing Framework
- **Unit tests** (Frontend + Backend)
- **Integration tests** with PostgreSQL/Redis
- **E2E tests** with Playwright
- **Performance testing** with Lighthouse
- **Security scanning** with CodeQL + OWASP

### 📊 Monitoring & Alerting
- **Real-time dashboards** with CloudWatch
- **Automatic alerts** via email + Slack
- **Health checks** for all services
- **Performance metrics** tracking
- **Custom business metrics**

### 🔒 Security & Quality
- **Code quality** analysis with SonarQube
- **Security scanning** with CodeQL
- **Dependency audit** with npm audit
- **Vulnerability scanning** with OWASP

## 🛠️ Core Scripts

### `deploy.sh` - Main Deployment Script
```bash
# Production deployment
./deploy.sh production

# Staging deployment  
./deploy.sh staging

# Skip tests for faster deployment
./deploy.sh production --skip-tests

# Skip backup creation
./deploy.sh production --skip-backup

# Rollback to previous version
./deploy.sh production --rollback

# Dry run (preview without executing)
./deploy.sh production --dry-run

# Verbose logging
./deploy.sh production --verbose
```

**Features:**
- ✅ Pre-deployment validation
- ✅ Automatic backup creation
- ✅ Health checks with retry logic
- ✅ Rollback on failure
- ✅ Notification system
- ✅ Comprehensive logging

### `setup-github-secrets.sh` - Automated Setup
```bash
./setup-github-secrets.sh laburemos/platform
```

**Configures:**
- AWS credentials
- Notification settings (email + Slack)
- SonarQube integration
- Environment protection rules
- All LABUREMOS-specific secrets

## 🔄 GitHub Actions Workflows

### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd-main.yml`)

**Triggered by:**
- Push to `main` → Production deployment
- Push to `develop` → Staging deployment
- Pull requests → Code quality checks
- Manual trigger → Custom deployment

**Pipeline Phases:**
1. **Code Quality** - ESLint, TypeScript, SonarQube
2. **Security Scan** - CodeQL, npm audit, OWASP
3. **Testing** - Unit, Integration, E2E tests
4. **Deployment** - Staging/Production deployment
5. **Post-Deploy** - Smoke tests, Lighthouse audit
6. **Monitoring** - Update dashboards and alerts

### 2. Emergency Rollback (`.github/workflows/rollback.yml`)

**Manual Trigger:** Requires confirmation ("CONFIRM")

**Steps:**
1. Validate rollback request
2. Send emergency notifications
3. Execute rollback (frontend + backend)
4. Run health checks
5. Perform smoke tests
6. Send completion notifications

## 📊 Monitoring System

### CloudWatch Dashboard
- **Frontend Performance** - CloudFront metrics
- **Backend Health** - EC2 system metrics
- **Database Performance** - RDS metrics
- **Business Metrics** - Custom application metrics
- **Error Tracking** - Application logs analysis

### Automated Alerts
- **Critical Alerts** - Service down, high error rates
- **Warning Alerts** - Performance degradation
- **Composite Alarms** - Overall system health
- **Notification Channels** - Email + Slack

### Key Metrics Monitored
```
Frontend (CloudFront):
- Request count and error rates (4xx/5xx)
- Origin latency and cache hit ratio
- Data transfer and bandwidth usage

Backend (EC2):
- CPU utilization and memory usage
- Network I/O and disk usage
- Status checks and health endpoints

Database (RDS):
- CPU/Memory utilization
- Connection count and query performance
- Storage space and backup status

Application:
- API response times
- Error rates and user sessions
- Business metrics (registrations, projects)
```

## 🔧 Configuration Files

### Environment URLs
```bash
# Production
https://laburemos.com.ar
https://www.laburemos.com.ar

# Backend API
http://3.81.56.168:3001
http://3.81.56.168:3002

# Staging (when configured)
https://staging.laburemos.com.ar
```

### AWS Resources
```yaml
CloudFront Distribution: E1E1QZ7YLALIAZ
S3 Bucket: laburemos-files-2025
EC2 Instance: 3.81.56.168
RDS Endpoint: laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com
Certificate ARN: arn:aws:acm:us-east-1:529496937346:certificate/...
```

## 🚨 Emergency Procedures

### Production Rollback
```bash
# Method 1: Using deploy script
./deploy.sh production --rollback

# Method 2: Using GitHub Actions
# Go to: https://github.com/laburemos/platform/actions/workflows/rollback.yml
# Click "Run workflow" and enter "CONFIRM"
```

### Health Check Failures
```bash
# Check system status
curl -f https://laburemos.com.ar
curl -f http://3.81.56.168:3001/health
curl -f http://3.81.56.168:3002/health

# Check logs
./deploy.sh production --verbose
tail -f logs/deploy-*.log
```

### Database Issues
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier laburemos-db

# Check connections
aws rds describe-db-log-files --db-instance-identifier laburemos-db
```

## 📈 Performance Benchmarks

### Expected Metrics
```
Deploy Time: < 10 minutes (full pipeline)
Rollback Time: < 5 minutes
Frontend Load Time: < 2 seconds
API Response Time: < 500ms
Uptime Target: 99.9%
Test Coverage: > 80%
Security Score: A+
Performance Score: > 90
```

### Optimization Features
- **CDN Caching** - Global content delivery
- **Database Optimization** - Connection pooling
- **Auto-scaling** - Based on CPU/memory thresholds
- **Compression** - Gzip for all assets
- **Image Optimization** - WebP format support

## 🔐 Security Features

### Code Security
- **Static Analysis** - SonarQube quality gates
- **Dependency Scanning** - npm audit + OWASP
- **Secret Management** - GitHub Secrets encryption
- **Access Control** - Environment protection rules

### Infrastructure Security
- **SSL/TLS** - ACM certificates with auto-renewal
- **WAF Protection** - CloudFront security rules
- **VPC Security** - Private subnets for RDS
- **IAM Roles** - Least privilege access

### Compliance
- **Audit Logs** - All deployment activities logged
- **Change Management** - PR-based deployment process
- **Backup Policy** - 10-version retention
- **Incident Response** - Automated rollback + notifications

## 🛡️ Disaster Recovery

### Backup Strategy
```bash
# Automatic backups before each deployment
Frontend: S3 version snapshots
Backend: EC2 application backups
Database: RDS automated backups (7-day retention)
Configuration: GitHub version control
```

### Recovery Procedures
1. **Service Outage** → Automatic rollback triggered
2. **Data Corruption** → RDS point-in-time recovery
3. **Infrastructure Failure** → Multi-AZ failover
4. **Code Issues** → Git revert + redeploy

## 📞 Support & Troubleshooting

### Common Issues

**1. Deployment Fails**
```bash
# Check logs
tail -f logs/deploy-*.log

# Verify AWS credentials
aws sts get-caller-identity

# Check service health
curl -f https://laburemos.com.ar
```

**2. Tests Failing**
```bash
# Run tests locally
cd frontend && npm run lint && npm run type-check
cd backend && npm run lint && npm run test

# Check test logs in GitHub Actions
```

**3. Performance Issues**
```bash
# Check CloudWatch metrics
# Monitor Lighthouse scores
# Review database performance
```

### Getting Help
- **Documentation**: This guide + inline code comments
- **Logs**: `logs/deploy-*.log` files
- **Monitoring**: CloudWatch Dashboard
- **Alerts**: Email + Slack notifications
- **GitHub Issues**: For bug reports and feature requests

## 🎉 Success Metrics

The CI/CD system is considered successful when:

✅ **Zero-downtime deployments** - No service interruption  
✅ **Automatic rollback** - Recovery time < 5 minutes  
✅ **Test coverage** - > 80% code coverage maintained  
✅ **Security score** - A+ rating maintained  
✅ **Performance** - Load time < 2 seconds  
✅ **Reliability** - 99.9% uptime achieved  
✅ **Monitoring** - Real-time visibility into all systems  
✅ **Notifications** - Instant alerts for any issues  

---

**🚀 Your LABUREMOS CI/CD system is now enterprise-ready and production-capable!**