# LABUREMOS CI/CD Pipeline Setup Checklist

## 🎯 Quick Setup Guide

This checklist ensures proper configuration of the CI/CD pipeline for LABUREMOS deployment to AWS.

---

## ✅ Prerequisites Checklist

### AWS Account Setup
- [ ] AWS Account created and billing enabled
- [ ] AWS CLI v2.x installed locally
- [ ] AWS CLI configured with admin credentials
- [ ] Domain name registered (optional but recommended)
- [ ] SSL certificate requested in ACM (us-east-1 region)

### Local Development Environment
- [ ] Node.js 18.x installed
- [ ] Docker and Docker Compose installed
- [ ] Git configured with your credentials
- [ ] GitHub CLI installed (optional)

### Repository Setup
- [ ] Repository forked to your GitHub account
- [ ] Local clone of the repository
- [ ] Verify frontend and backend run locally

---

## 🔐 GitHub Secrets Configuration

### AWS Credentials
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key for CI/CD user
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key for CI/CD user  
- [ ] `AWS_ACCOUNT_ID` - Your 12-digit AWS account ID

### Database Configuration
- [ ] `DB_PASSWORD_STAGING` - Strong password for staging databases
- [ ] `DB_PASSWORD_PRODUCTION` - Strong password for production databases
- [ ] `DATABASE_URL_STAGING` - Will be set after infrastructure deployment
- [ ] `DATABASE_URL_PRODUCTION` - Will be set after infrastructure deployment

### Redis Configuration
- [ ] `REDIS_AUTH_TOKEN_STAGING` - Random 32-character string
- [ ] `REDIS_AUTH_TOKEN_PRODUCTION` - Random 32-character string

### SSL and Domain (Optional but Recommended)
- [ ] `SSL_CERTIFICATE_ARN` - ARN of your SSL certificate
- [ ] `DOMAIN_NAME` - Your domain name (e.g., laburemos.com)

### Monitoring and Notifications
- [ ] `SLACK_WEBHOOK_URL` - Slack webhook for deployment notifications
- [ ] `SONAR_TOKEN` - SonarCloud token for code quality analysis
- [ ] `SNYK_TOKEN` - Snyk token for security scanning

---

## 🏗️ Infrastructure Setup Steps

### Step 1: Create CI/CD IAM User
```bash
# Create IAM user
aws iam create-user --user-name laburemos-ci-user

# Attach PowerUser policy (or create custom policy with minimal permissions)
aws iam attach-user-policy \
  --user-name laburemos-ci-user \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Create access keys
aws iam create-access-key --user-name laburemos-ci-user
```
- [ ] IAM user created
- [ ] Access keys generated and added to GitHub secrets
- [ ] User has required permissions

### Step 2: SSL Certificate (Production)
```bash
# Request certificate in us-east-1 (required for CloudFront)
aws acm request-certificate \
  --domain-name your-domain.com \
  --subject-alternative-names www.your-domain.com \
  --validation-method DNS \
  --region us-east-1
```
- [ ] SSL certificate requested
- [ ] DNS validation completed
- [ ] Certificate ARN added to GitHub secrets

### Step 3: Configure External Services

#### SonarCloud Setup
1. [ ] Go to https://sonarcloud.io/
2. [ ] Sign up with GitHub account
3. [ ] Import your repository
4. [ ] Get organization key and project key
5. [ ] Generate token and add to GitHub secrets

#### Snyk Setup
1. [ ] Go to https://snyk.io/
2. [ ] Sign up with GitHub account
3. [ ] Connect your repository
4. [ ] Generate API token
5. [ ] Add token to GitHub secrets

#### Slack Integration
1. [ ] Create Slack webhook URL
2. [ ] Add webhook URL to GitHub secrets
3. [ ] Test notification (optional)

---

## 🚀 Deployment Process

### First Deployment - Staging

- [ ] Push code to `develop` branch
- [ ] Verify GitHub Actions workflow starts
- [ ] Monitor deployment progress in Actions tab
- [ ] Check AWS CloudFormation stack creation
- [ ] Verify staging application is accessible
- [ ] Run smoke tests on staging environment

### First Deployment - Production

- [ ] Merge `develop` to `main` branch
- [ ] Push `main` branch
- [ ] Monitor production deployment
- [ ] Verify production application is accessible
- [ ] Configure domain DNS (if using custom domain)
- [ ] Test all critical user flows

---

## 📊 Post-Deployment Verification

### Infrastructure Verification
- [ ] CloudFormation stacks deployed successfully
- [ ] ECS services running and healthy
- [ ] RDS instances accessible and healthy
- [ ] ElastiCache cluster operational
- [ ] Load balancers responding
- [ ] S3 buckets created with proper permissions
- [ ] CloudFront distributions active

### Application Verification
- [ ] Frontend loads without errors
- [ ] Backend API responds to health checks
- [ ] Database connections working
- [ ] Redis caching functional
- [ ] User registration/login works
- [ ] File uploads working (if applicable)

### Monitoring Setup
- [ ] CloudWatch dashboard accessible
- [ ] Alarms configured and active
- [ ] Log aggregation working
- [ ] Notification channels working
- [ ] Health check endpoints responding

---

## 🔧 Configuration Updates

### Update Environment Variables
After infrastructure deployment, update these secrets with actual values:

```bash
# Get RDS endpoints from CloudFormation outputs
aws cloudformation describe-stacks \
  --stack-name laburemos-staging \
  --query 'Stacks[0].Outputs'

aws cloudformation describe-stacks \
  --stack-name laburemos-production \
  --query 'Stacks[0].Outputs'
```

- [ ] `DATABASE_URL_STAGING` updated with actual endpoint
- [ ] `DATABASE_URL_PRODUCTION` updated with actual endpoint
- [ ] Backend environment variables verified

### DNS Configuration (If Using Custom Domain)
- [ ] Add CNAME record pointing to CloudFront distribution
- [ ] Verify domain resolves correctly
- [ ] SSL certificate validates on custom domain
- [ ] Redirect www to apex domain (or vice versa)

---

## 🧪 Testing Checklist

### Automated Tests
- [ ] CI pipeline passes all tests
- [ ] Frontend unit tests passing
- [ ] Backend unit tests passing
- [ ] E2E tests passing
- [ ] Security scans passing
- [ ] Load tests completing successfully

### Manual Testing
- [ ] Homepage loads correctly
- [ ] User registration flow works
- [ ] User login flow works
- [ ] Core functionality accessible
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility checked

---

## 🔄 Rollback Preparation

### Rollback Testing
- [ ] Test rollback workflow on staging
- [ ] Verify database backup/restore process
- [ ] Document rollback procedures
- [ ] Train team on emergency rollback process

### Emergency Contacts
- [ ] DevOps team contact information documented
- [ ] Escalation procedures defined
- [ ] Emergency communication channels set up

---

## 📋 Documentation Updates

### Internal Documentation
- [ ] Architecture diagrams updated
- [ ] Deployment procedures documented
- [ ] Troubleshooting guide created
- [ ] Emergency procedures documented

### Team Training
- [ ] Team trained on new deployment process
- [ ] Access permissions granted to team members
- [ ] Monitoring dashboard access provided
- [ ] Incident response procedures communicated

---

## ✅ Final Validation

### Pre-Go-Live Checklist
- [ ] All tests passing in production environment
- [ ] Performance benchmarks met
- [ ] Security requirements satisfied
- [ ] Backup and recovery procedures tested
- [ ] Monitoring and alerting functional
- [ ] Team trained and ready
- [ ] Documentation complete and accessible

### Go-Live Readiness
- [ ] Stakeholder approval obtained
- [ ] Go-live date scheduled
- [ ] Communication plan executed
- [ ] Support team on standby
- [ ] Rollback plan confirmed

---

## 🎉 Post Go-Live

### Immediate Actions (First 24 Hours)
- [ ] Monitor application performance
- [ ] Check error rates and logs
- [ ] Verify user feedback
- [ ] Confirm all integrations working
- [ ] Document any issues and resolutions

### First Week Actions
- [ ] Review performance metrics
- [ ] Analyze cost usage
- [ ] Gather user feedback
- [ ] Plan optimization improvements
- [ ] Schedule regular maintenance tasks

---

## 📞 Support and Troubleshooting

### Common Issues and Solutions

**Issue**: CloudFormation stack creation fails
- **Solution**: Check IAM permissions, resource limits, and parameter values

**Issue**: ECS service won't start
- **Solution**: Check container logs, security groups, and task definition

**Issue**: Application not accessible
- **Solution**: Verify load balancer, security groups, and DNS configuration

**Issue**: Database connection errors
- **Solution**: Check security groups, connection strings, and credentials

### Getting Help
- **Documentation**: See `CI-CD-DEPLOYMENT-GUIDE.md` for detailed instructions
- **GitHub Issues**: Create issue for bugs or feature requests  
- **Community**: Join discussions in repository discussions tab
- **Support**: Contact development team for urgent issues

---

This checklist ensures a smooth and successful deployment of the LABUREMOS CI/CD pipeline. Complete each item systematically for the best results.