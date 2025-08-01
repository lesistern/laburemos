# LABUREMOS - Master Project Index

**Professional Freelance Platform | Dual Stack Architecture | Production Ready**

## Quick Start Guide

### 1. Initial Setup
```bash
# Clone and navigate to project
cd C:\xampp\htdocs\Laburar

# Run automated Windows setup
setup-windows.bat

# Start all services
start-windows.bat
```

### 2. Access Points
| Service | URL | Status |
|---------|-----|--------|
| Next.js Frontend | http://localhost:3000 | Production Ready |
| NestJS Backend | http://localhost:3001/docs | Microservices |
| Legacy PHP | http://localhost/Laburar | Fully Functional |
| Database Admin | http://localhost/phpmyadmin | MySQL Management |

### 3. First Time Setup
1. **Read Documentation**: Start with [CLAUDE.md](./CLAUDE.md)
2. **Setup Database**: Run `/database/setup_database.php`
3. **Verify Services**: Check all URLs above are responding
4. **Test Authentication**: Login with contacto.laburemos@gmail.com/admin123

## Project Architecture

### Technology Stack
- **Frontend**: Next.js 15.4.4 + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: NestJS microservices + PostgreSQL + Redis + Stripe
- **Legacy**: PHP 8.2 + MySQL 8.0 + jQuery (preserved and functional)
- **DevOps**: Docker + GitHub Actions + AWS ECS + GCP Cloud Run
- **Windows**: XAMPP optimization + automated scripts

### Key Features
- **Dual Stack**: Modern (Next.js/NestJS) + Legacy (PHP/MySQL) architectures
- **Enterprise Dashboard**: Liquid glass UI with Chart.js analytics
- **Badge System**: 100 Founder badges (64x64px) with gamification
- **Authentication**: Modal-based login/register system  
- **Responsive Design**: Mobile-first with WCAG AA compliance
- **Real-time Features**: WebSocket notifications and live updates

## Directory Structure

```
Laburar/
├── frontend/                 # Next.js 15.4.4 application (47 files)
├── backend/                  # NestJS microservices (5 services)
├── infrastructure/           # Docker, CI/CD, monitoring
├── database/                 # MySQL schemas and migrations
├── dashboard/                # Enterprise dashboard PHP
├── public/                   # Static assets, CSS, JavaScript
├── app/                      # PHP application (MVC structure)
├── config/                   # Configuration files
├── CLAUDE-*.md              # Specialized documentation
├── setup-windows.bat        # Automated Windows setup
└── start-windows.bat        # Service startup script
```

## Documentation System

### Essential Reading Order
1. **[CLAUDE.md](./CLAUDE.md)** - Main reference and quick start
2. **[CLAUDE-STACK.md](./CLAUDE-STACK.md)** - Technology stack details
3. **[CLAUDE-ARCHITECTURE.md](./CLAUDE-ARCHITECTURE.md)** - System architecture
4. **[CLAUDE-DEVELOPMENT.md](./CLAUDE-DEVELOPMENT.md)** - Development patterns
5. **[CLAUDE-RULES.md](./CLAUDE-RULES.md)** - Critical requirements

### Reference Documentation
| File | Purpose | When to Read |
|------|---------|--------------|
| [CLAUDE-PROJECT.md](./CLAUDE-PROJECT.md) | Project overview | Project understanding |
| [CLAUDE-WORKFLOWS.md](./CLAUDE-WORKFLOWS.md) | Development workflows | Before coding |
| [CLAUDE-SESSIONS.md](./CLAUDE-SESSIONS.md) | Implementation history | Historical context |
| [CLAUDE-IMPLEMENTATION.md](./CLAUDE-IMPLEMENTATION.md) | Current status | Progress tracking |
| [DOCUMENTATION-MAP.md](./DOCUMENTATION-MAP.md) | Cross-references | Navigation help |

## Current Implementation Status

### ✅ Completed (Production Ready)
- **Frontend Migration**: Next.js 15.4.4 complete with 47 functional files
- **Backend Architecture**: NestJS microservices with PostgreSQL/Redis
- **Enterprise Dashboard**: Liquid glass UI with analytics and badges
- **Database Schema**: MySQL with 15+ tables, stored procedures, triggers
- **Windows Integration**: Automated setup and startup scripts
- **Legacy Preservation**: Original PHP platform fully functional

### 🚀 In Progress
- **API Integration**: Connecting Next.js frontend to NestJS backend
- **Data Migration**: MySQL to PostgreSQL transition planning
- **Testing Suite**: E2E tests for complete user workflows
- **Performance Optimization**: Fullstack tuning and monitoring

### 📋 Planned
- **Real-time Features**: WebSocket integration for live notifications
- **Analytics Dashboard**: Advanced metrics and reporting
- **Security Review**: Comprehensive security audit
- **Mobile App**: React Native companion application

## Development Workflows

### Backend Development
```bash
# Start NestJS services
cd backend
npm run start:dev

# View API documentation
open http://localhost:3001/docs
```

### Frontend Development
```bash
# Start Next.js development
cd frontend
npm run dev

# View application
open http://localhost:3000
```

### Legacy Development
```bash
# Start XAMPP services
xampp-control.exe

# Access legacy platform
open http://localhost/Laburar
```

### Database Management
```bash
# MySQL (Legacy)
open http://localhost/phpmyadmin

# PostgreSQL (Modern)
open http://localhost:8080

# Setup database
php database/setup_database.php
```

## Key Credentials

### Default Admin Account
- **Email**: contacto.laburemos@gmail.com
- **Password**: admin123
- **Role**: Administrator

### Database Connections
- **MySQL**: root / (no password) / laburar_db
- **PostgreSQL**: postgres / postgres / laburar

### Service Ports
- **Next.js**: 3000
- **NestJS**: 3001
- **PHP/Apache**: 80
- **MySQL**: 3306
- **PostgreSQL**: 5432
- **Redis**: 6379

## Support and Troubleshooting

### Common Issues
1. **Port Conflicts**: Stop conflicting services or change ports
2. **Dependencies Missing**: Run `fix-frontend-windows.bat`
3. **Database Connection**: Verify XAMPP MySQL is running
4. **Permission Errors**: Run scripts as Administrator

### Getting Help
- **Documentation**: Check relevant CLAUDE-*.md files
- **Error Logs**: Check service-specific log files
- **Reset Environment**: Re-run setup-windows.bat
- **Database Issues**: Re-run database/setup_database.php

## Project Highlights

### Technical Achievements
- **Dual Architecture**: Seamless integration of modern and legacy stacks
- **Enterprise UI**: Professional dashboard with liquid glass effects
- **Microservices**: Scalable NestJS backend architecture
- **Windows Optimization**: Native Windows development environment
- **Documentation**: Comprehensive modular documentation system

### Business Features
- **Freelance Platform**: Complete marketplace functionality
- **Badge System**: Gamification with 100 unique founder badges (64x64px)
- **Analytics**: Chart.js integration for earnings and metrics
- **Responsive Design**: Mobile-first approach with WCAG compliance
- **Real-time Updates**: WebSocket-based live notifications

---

**Last Updated**: 2025-07-28  
**Version**: 2.0 (Modern Stack + Legacy Preserved)  
**Status**: Production Ready

For immediate assistance, start with [CLAUDE.md](./CLAUDE.md) or run the automated setup scripts.