# GitHub Secrets Configuration Guide

## 🔐 Required GitHub Repository Secrets

Navigate to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

### Core AWS Secrets

Click **"New repository secret"** for each:

```
Secret Name: AWS_ACCESS_KEY_ID
Secret Value: AKIA1234567890EXAMPLE
```

```
Secret Name: AWS_SECRET_ACCESS_KEY  
Secret Value: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

```
Secret Name: AWS_DEFAULT_REGION
Secret Value: us-east-1
```

### Database & Cache Secrets

```
Secret Name: DATABASE_PASSWORD
Secret Value: YourSecurePassword123!
```

```
Secret Name: MYSQL_PASSWORD
Secret Value: YourSecurePassword123!
```

```
Secret Name: REDIS_AUTH_TOKEN
Secret Value: YourSecureRedisToken123456789!
```

### Application Secrets

```
Secret Name: JWT_SECRET
Secret Value: your-super-secure-jwt-secret-key-256-bits-long
```

```
Secret Name: JWT_REFRESH_SECRET
Secret Value: your-super-secure-refresh-token-secret-key-256-bits
```

```
Secret Name: NEXTAUTH_SECRET
Secret Value: your-nextauth-secret-for-frontend-auth
```

### Optional Integration Secrets

```
Secret Name: SLACK_WEBHOOK
Secret Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

```
Secret Name: SONAR_TOKEN
Secret Value: sqp_1234567890abcdef1234567890abcdef12345678
```

```
Secret Name: SNYK_TOKEN
Secret Value: 12345678-1234-1234-1234-123456789012
```

## 🌍 Environment-Specific Variables

### Staging Environment Secrets

Go to **Settings** → **Environments** → **staging** → **Environment secrets**:

```
NEXT_PUBLIC_API_URL=https://staging-alb.us-east-1.elb.amazonaws.com
NEXT_PUBLIC_WS_URL=wss://staging-alb.us-east-1.elb.amazonaws.com
DATABASE_URL=postgresql://postgres:YourSecurePassword123!@staging-postgres.region.rds.amazonaws.com:5432/laburemos
MYSQL_URL=mysql://admin:YourSecurePassword123!@staging-mysql.region.rds.amazonaws.com:3306/laburar_db
REDIS_URL=redis://:YourSecureRedisToken123456789!@staging-redis.region.cache.amazonaws.com:6379
```

### Production Environment Secrets

Go to **Settings** → **Environments** → **production** → **Environment secrets**:

```
NEXT_PUBLIC_API_URL=https://api.laburemos.com
NEXT_PUBLIC_WS_URL=wss://api.laburemos.com
DATABASE_URL=postgresql://postgres:YourSecurePassword123!@production-postgres.region.rds.amazonaws.com:5432/laburemos
MYSQL_URL=mysql://admin:YourSecurePassword123!@production-mysql.region.rds.amazonaws.com:3306/laburar_db
REDIS_URL=redis://:YourSecureRedisToken123456789!@production-redis.region.cache.amazonaws.com:6379
```

## 🏗️ How to Get Infrastructure URLs

After deploying your CloudFormation stack, get the endpoints:

```bash
# Get staging stack outputs
~/.local/bin/aws cloudformation describe-stacks \
  --stack-name laburemos-staging \
  --query 'Stacks[0].Outputs' \
  --output table

# Get production stack outputs  
~/.local/bin/aws cloudformation describe-stacks \
  --stack-name laburemos-production \
  --query 'Stacks[0].Outputs' \
  --output table
```

## 🔒 Security Best Practices

### Password Generation
```bash
# Generate secure passwords
openssl rand -base64 32

# Generate JWT secrets (256-bit)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Rotation Schedule
- **Database passwords**: Every 90 days
- **JWT secrets**: Every 6 months
- **API tokens**: Every 30 days
- **Redis auth tokens**: Every 90 days

### Access Control
- [ ] **Repository access**: Limit to necessary team members
- [ ] **Secret access**: Use environment protection rules
- [ ] **AWS permissions**: Principle of least privilege
- [ ] **Audit logging**: Enable GitHub audit log

## 📋 Validation Checklist

Before triggering deployment, verify:

- [ ] All required secrets are set (no missing values)
- [ ] Database URLs match your RDS endpoints
- [ ] Redis URLs match your ElastiCache endpoints
- [ ] JWT secrets are sufficiently complex (32+ characters)
- [ ] Environment protection rules are configured
- [ ] Branch protection is enabled for main/develop

## 🚀 Trigger First Deployment

After configuring secrets:

```bash
# Create develop branch if it doesn't exist
git checkout -b develop
git push origin develop

# Push to trigger CI/CD pipeline
git add .
git commit -m "feat: Configure CI/CD pipeline and AWS infrastructure

🚀 Add complete GitHub Actions workflows for:
- Automated testing (unit, integration, e2e)
- Security scanning (Trivy, ESLint, dependency checks)
- Docker image building and pushing to ECR
- Blue-green deployment to ECS Fargate
- Automatic rollback on failures

🏗️ Add AWS CloudFormation templates for:
- VPC with public/private subnets
- RDS PostgreSQL and MySQL (Multi-AZ for production)
- ElastiCache Redis cluster
- ECS Fargate with Application Load Balancer
- S3 and CloudFront for frontend distribution
- CloudWatch monitoring and alerting

🔒 Security features:
- Container vulnerability scanning
- Encrypted storage and transit
- IAM least privilege principles
- Security headers configuration

Generated with Claude Code"

git push origin develop
```

## 📊 Monitor Deployment

1. **GitHub Actions**: Watch the workflow progress in the Actions tab
2. **AWS Console**: Monitor CloudFormation stack creation
3. **ECS Console**: Watch service deployment status
4. **CloudWatch**: Check logs for any issues

## 🆘 Troubleshooting

**Secret not found error:**
- Verify secret name matches exactly (case-sensitive)
- Check environment scope (repository vs environment)

**Invalid credentials error:**
- Regenerate AWS access keys
- Verify IAM user has required permissions
- Check AWS region matches

**Database connection error:**
- Verify security groups allow connections
- Check database endpoint URLs
- Test connectivity from ECS tasks

**Deployment timeout:**
- Check ECS service events
- Review CloudWatch logs
- Verify health check endpoints

---

**Ready to deploy?** All secrets configured means your CI/CD pipeline can automatically deploy to AWS! 🚀