# LABUREMOS Backend - AWS Production Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions to deploy the LABUREMOS NestJS backend to AWS EC2 with PostgreSQL RDS.

## 📋 Current Setup Status

- **EC2 Instance**: `3.81.56.168` (running Ubuntu)
- **RDS PostgreSQL**: `laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432`
- **Database**: `laburemos_db`
- **Application Port**: `3001`

## 🚀 Quick Deployment

Run the automated deployment script:

```bash
cd /mnt/d/Laburar/backend
./deploy-aws.sh
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication module
│   ├── user/              # User management
│   ├── category/          # Service categories
│   ├── service/           # Service management
│   ├── project/           # Project management
│   ├── payment/           # Payment processing
│   ├── notification/      # Real-time notifications
│   └── common/            # Shared utilities
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seeding
├── .env.production       # Production environment
└── deploy-aws.sh         # Deployment script
```

## 🔧 Manual Deployment Steps

### 1. Prerequisites

- AWS CLI configured with appropriate permissions
- SSH key for EC2 access (`~/.ssh/laburemos-key.pem`)
- Node.js 18+ and npm installed locally

### 2. Build Application

```bash
# Install dependencies
npm ci

# Build the application
npm run build

# Run tests (optional)
npm test
```

### 3. Environment Configuration

Update `.env.production` with your specific values:

```env
# Database - AWS RDS PostgreSQL
DATABASE_URL=postgresql://postgres:YourPassword@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos_db

# JWT Secrets (generate new ones for production)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# CORS Configuration
CORS_ORIGINS=http://3.81.56.168:3000,https://yourdomain.com

# Other services...
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### 5. Server Configuration

The deployment script automatically configures:

- **PM2**: Process management and clustering
- **Nginx**: Reverse proxy and load balancing
- **UFW**: Firewall configuration
- **Systemd**: Service auto-restart

### 6. SSL Certificate (Optional)

For production HTTPS:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/health` - Health check

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/hierarchy` - Category tree
- `POST /api/categories` - Create category (Admin)

### Services
- `GET /api/services` - List services with filters
- `GET /api/services/featured` - Featured services
- `POST /api/services` - Create service (Freelancer)

### Users
- `GET /api/users/profile` - User profile
- `PATCH /api/users/profile` - Update profile

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project

## 🔍 Monitoring & Debugging

### Application Status

```bash
# SSH to server
ssh -i ~/.ssh/laburemos-key.pem ubuntu@3.81.56.168

# Check PM2 status
pm2 status

# View application logs
pm2 logs laburemos-backend

# View system logs
sudo journalctl -u nginx -f
```

### Health Checks

```bash
# API health check
curl http://3.81.56.168/api/auth/health

# Database connection test
curl http://3.81.56.168/api/categories

# Service status
curl -I http://3.81.56.168/docs
```

### Performance Monitoring

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h
free -h
```

## 🛠 Troubleshooting

### Common Issues

1. **Port 3001 not accessible**
   ```bash
   sudo ufw status
   sudo ufw allow 3001
   ```

2. **Database connection errors**
   ```bash
   # Test connection
   psql -h laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com -U postgres -d laburemos_db
   ```

3. **PM2 application crashed**
   ```bash
   pm2 restart laburemos-backend
   pm2 logs laburemos-backend --lines 100
   ```

4. **Nginx configuration errors**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Log Locations

- Application logs: `/home/ubuntu/laburemos/backend/logs/`
- Nginx logs: `/var/log/nginx/`
- PM2 logs: `~/.pm2/logs/`

## 🔒 Security Considerations

- All sensitive data is stored in environment variables
- JWT tokens use strong secrets
- Rate limiting is enabled
- CORS is properly configured
- Firewall rules are restrictive
- Database uses SSL connections

## 📈 Production Optimization

### Performance

- PM2 cluster mode for multi-core utilization
- Nginx compression and caching
- Database connection pooling
- Redis for session storage

### Scaling

- Auto-scaling groups (ASG) for EC2
- Application Load Balancer (ALB)
- ElastiCache for Redis
- CloudWatch monitoring
- RDS read replicas

## 🎉 Deployment Verification

After deployment, verify these endpoints:

1. **Health Check**: http://3.81.56.168/api/auth/health
2. **API Documentation**: http://3.81.56.168/docs
3. **Categories**: http://3.81.56.168/api/categories
4. **Featured Services**: http://3.81.56.168/api/services/featured

## 📞 Support

If you encounter issues:

1. Check the logs first: `pm2 logs laburemos-backend`
2. Verify environment variables: `pm2 env 0`
3. Test database connectivity
4. Check Nginx configuration
5. Review security group settings in AWS

---

**Last Updated**: 2025-01-31  
**Version**: 1.0.0  
**Environment**: AWS Production