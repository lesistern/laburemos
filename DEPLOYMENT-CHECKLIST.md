# LABUREMOS AWS Deployment Checklist

## 🎯 Complete Deployment Guide

This checklist ensures a successful deployment of the LABUREMOS platform to AWS with full CI/CD automation.

### ✅ Phase 1: Prerequisites & Setup

#### 1.1 Local Environment
- [ ] **AWS CLI installed**: `~/.local/bin/aws --version` (should show v2.x)
- [ ] **Node.js 18.x installed**: `node --version`
- [ ] **Docker installed**: `docker --version`
- [ ] **Git repository setup**: Code pushed to GitHub

#### 1.2 AWS Account Preparation
- [ ] **AWS Console Access**: https://us-east-1.console.aws.amazon.com/console/home
- [ ] **Billing enabled**: Check AWS Billing Dashboard
- [ ] **Service quotas sufficient**: ECS, RDS, ElastiCache limits
- [ ] **Domain name ready** (optional): For custom URLs

### ✅ Phase 2: AWS Infrastructure Setup

#### 2.1 Create IAM User for CI/CD
```bash
# Run these commands in AWS Console > CloudShell or local AWS CLI

# 1. Create IAM user
aws iam create-user --user-name laburemos-ci-user

# 2. Attach PowerUserAccess policy
aws iam attach-user-policy \
  --user-name laburemos-ci-user \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# 3. Create access keys
aws iam create-access-key --user-name laburemos-ci-user
```

**Action Required**: Save the Access Key ID and Secret Access Key securely!

#### 2.2 Configure Local AWS CLI
```bash
# Configure with your new credentials
~/.local/bin/aws configure

# Test configuration
~/.local/bin/aws sts get-caller-identity
```

#### 2.3 Deploy Infrastructure
```bash
# Navigate to project directory
cd /mnt/d/Laburar

# Run the automated setup script
./aws-setup-deployment.sh

# Or deploy manually:
~/.local/bin/aws cloudformation deploy \
  --template-file infrastructure/aws/cloudformation-staging.yml \
  --stack-name laburemos-staging \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment=staging \
    DatabasePassword=YourSecurePassword123! \
    RedisAuthToken=YourSecureRedisToken123! \
  --region us-east-1
```

**Action Required**: 
- [ ] Infrastructure deployment successful
- [ ] Stack status: CREATE_COMPLETE
- [ ] Note down the output URLs

### ✅ Phase 3: GitHub Configuration

#### 3.1 GitHub Secrets Setup
Navigate to your repository → Settings → Secrets and variables → Actions

**Required Secrets:**
```
AWS_ACCESS_KEY_ID=<your-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-access-key>
DATABASE_PASSWORD=<your-secure-database-password>
REDIS_AUTH_TOKEN=<your-secure-redis-token>
JWT_SECRET=<your-secure-jwt-secret>

# Optional but recommended
SLACK_WEBHOOK=<your-slack-webhook-url>
SONAR_TOKEN=<your-sonarcloud-token>
SNYK_TOKEN=<your-snyk-token>
```

**Environment Secrets (staging):**
```
NEXT_PUBLIC_API_URL=https://<staging-alb-url>
DATABASE_URL=postgresql://postgres:<password>@<staging-rds-endpoint>:5432/laburemos
MYSQL_URL=mysql://admin:<password>@<staging-mysql-endpoint>:3306/laburar_db
REDIS_URL=redis://:<auth-token>@<staging-redis-endpoint>:6379
```

#### 3.2 Branch Protection Rules
- [ ] **Main branch protected**: Require pull request reviews
- [ ] **Status checks required**: All CI tests must pass
- [ ] **Deployment environments configured**: staging, production

### ✅ Phase 4: Application Deployment

#### 4.1 Database Setup
```bash
# Connect to RDS instances and run migrations
# PostgreSQL (for NestJS backend)
psql -h <postgres-endpoint> -U postgres -d laburemos < backend/prisma/schema.sql

# MySQL (for legacy PHP backend)
mysql -h <mysql-endpoint> -u admin -p laburar_db < database/create_laburemos_db.sql
```

#### 4.2 Trigger Deployment
```bash
# Push to develop branch for staging deployment
git checkout develop
git push origin develop

# Push to main branch for production deployment
git checkout main
git merge develop
git push origin main
```

**Action Required**:
- [ ] GitHub Actions workflow triggered
- [ ] All tests passing (green checkmarks)
- [ ] Docker images built and pushed
- [ ] ECS services deployed successfully

### ✅ Phase 5: Verification & Testing

#### 5.1 Health Check Endpoints
```bash
# Test staging environment
curl -f https://<staging-cloudfront-url>/api/health
curl -f https://<staging-alb-url>/health

# Test production environment (if deployed)
curl -f https://<production-cloudfront-url>/api/health
curl -f https://<production-alb-url>/health
```

#### 5.2 Application Functionality
- [ ] **Frontend loads**: Browse to CloudFront URL
- [ ] **User registration works**: Create test account
- [ ] **Authentication functions**: Login/logout
- [ ] **API endpoints respond**: Check Swagger docs at `/docs`
- [ ] **WebSocket connections**: Real-time features work
- [ ] **Database connectivity**: Data persists correctly

#### 5.3 Performance & Security
```bash
# Load testing (if deployed production)
npx playwright test --config=e2e/load-tests/production-load-test.yml

# Security scan
npm audit
docker scan <image-name>
```

### ✅ Phase 6: Monitoring & Maintenance

#### 6.1 CloudWatch Setup
- [ ] **Dashboards configured**: Application and infrastructure metrics
- [ ] **Alarms created**: CPU, memory, error rates
- [ ] **Log groups active**: Application and access logs
- [ ] **Notifications working**: SNS/Slack alerts

#### 6.2 Backup Verification
- [ ] **RDS automated backups**: 7-day retention
- [ ] **S3 versioning enabled**: File upload backups
- [ ] **Code repository backups**: Multiple Git remotes

### ✅ Phase 7: Production Readiness

#### 7.1 SSL Certificates (If Custom Domain)
```bash
# Request ACM certificate
aws acm request-certificate \
  --domain-name laburemos.com \
  --subject-alternative-names www.laburemos.com \
  --validation-method DNS \
  --region us-east-1
```

#### 7.2 DNS Configuration
- [ ] **Route 53 hosted zone**: Domain configured
- [ ] **A records**: Point to CloudFront/ALB
- [ ] **CNAME records**: www subdomain
- [ ] **MX records**: Email setup (if needed)

#### 7.3 Final Production Deployment
```bash
# Deploy production infrastructure
~/.local/bin/aws cloudformation deploy \
  --template-file infrastructure/aws/cloudformation-production.yml \
  --stack-name laburemos-production \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Environment=production \
    DomainName=laburemos.com \
    DatabasePassword=<production-password> \
    RedisAuthToken=<production-redis-token> \
  --region us-east-1
```

---

## 🚀 Expected Final URLs

### Staging Environment
- **Frontend**: https://d1234567890.cloudfront.net
- **Backend API**: https://staging-alb-1234567890.us-east-1.elb.amazonaws.com
- **Swagger Docs**: https://staging-alb-1234567890.us-east-1.elb.amazonaws.com/docs
- **Health Check**: https://d1234567890.cloudfront.net/api/health

### Production Environment (with custom domain)
- **Frontend**: https://laburemos.com
- **Backend API**: https://api.laburemos.com
- **Swagger Docs**: https://api.laburemos.com/docs
- **Admin Dashboard**: https://laburemos.com/dashboard

---

## 📊 Cost Estimates

### Staging Environment (~$75/month)
- ECS Fargate: ~$30/month (2 tasks, minimal resources)
- RDS (2 instances): ~$25/month (db.t3.micro)
- ElastiCache: ~$15/month (cache.t3.micro)
- Other services: ~$5/month (S3, CloudFront, ALB)

### Production Environment (~$330/month)
- ECS Fargate: ~$180/month (Auto-scaling 3-10 tasks)
- RDS Multi-AZ: ~$100/month (High availability)
- ElastiCache Cluster: ~$40/month (Redis clustering)
- Other services: ~$10/month (Enhanced monitoring, backups)

---

## 🆘 Troubleshooting Guide

### Common Issues

**AWS CLI Not Found**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
python3 -m zipfile -e awscliv2.zip ./
./aws/install --install-dir ~/.local/aws-cli --bin-dir ~/.local/bin
```

**CloudFormation Stack Failed**
```bash
# Check stack events
~/.local/bin/aws cloudformation describe-stack-events --stack-name laburemos-staging

# Delete failed stack
~/.local/bin/aws cloudformation delete-stack --stack-name laburemos-staging
```

**ECS Service Not Starting**
```bash
# Check service events
~/.local/bin/aws ecs describe-services --cluster laburemos-staging --services laburemos-frontend

# Check task logs
~/.local/bin/aws logs tail /ecs/laburemos-frontend --follow
```

**Database Connection Issues**
```bash
# Test database connectivity
~/.local/bin/aws rds describe-db-instances --db-instance-identifier staging-postgres

# Check security groups
~/.local/bin/aws ec2 describe-security-groups --filters "Name=group-name,Values=*database*"
```

---

## ✅ Success Criteria

### Deployment Complete When:
- [ ] All CloudFormation stacks: CREATE_COMPLETE
- [ ] All ECS services: RUNNING (desired count reached)
- [ ] Health checks: All endpoints return 200 OK
- [ ] Application functional: User can register, login, use features
- [ ] Monitoring active: CloudWatch dashboards populated
- [ ] CI/CD working: Commits trigger deployments automatically

---

**Total estimated setup time**: 2-4 hours (first time), 30 minutes (subsequent deployments)

**Next Steps**: After successful deployment, refer to `CI-CD-DEPLOYMENT-GUIDE.md` for advanced configuration and maintenance procedures.