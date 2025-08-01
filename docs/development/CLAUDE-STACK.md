# LABUREMOS Technology Stack

**Modern Stack Architecture** | Production Ready | Microservices

## Technology Matrix

### Modern Stack (PRIMARY)
| Component | Technology | Version | Status | Port |
|-----------|------------|---------|--------|------|
| **Frontend** | Next.js | 15.4.4 | ✅ Production | 3000 |
| **Backend** | NestJS | Latest | ✅ Production | 3001 |
| **Database** | PostgreSQL | 15+ | ✅ Production | 5432 |
| **Cache** | Redis | 7+ | ✅ Production | 6379 |
| **ORM** | Prisma | Latest | ✅ Integrated | - |
| **Auth** | JWT/Refresh | - | ✅ Complete | - |
| **Payments** | Stripe | v3 | ✅ Integrated | - |
| **WebSocket** | Socket.io | Latest | ✅ Real-time | - |

### Legacy Stack (SUPPORT)
| Component | Technology | Version | Status | Port |
|-----------|------------|---------|--------|------|
| **Backend** | PHP | 8.2 | ✅ Functional | 80 |
| **Database** | MySQL | 8.0 | ✅ Operational | 3306 |
| **Frontend** | jQuery/CSS | - | ✅ Complete | - |

## Service Architecture

### NestJS Microservices
```
backend/src/
├── auth/           # JWT authentication service
├── user/           # User management service  
├── project/        # Project/gig service
├── payment/        # Stripe payment processing
├── notification/   # WebSocket notifications
└── common/         # Shared modules (database, redis)
```

### Next.js Application Structure
```
frontend/app/
├── page.tsx              # Landing page
├── dashboard/page.tsx    # User dashboard
├── categories/page.tsx   # Service categories
├── profile/page.tsx      # User profiles
├── projects/page.tsx     # Project management
├── messages/page.tsx     # Real-time messaging
├── wallet/page.tsx       # Payment/earnings
└── settings/page.tsx     # Account settings
```

## Quick Start Commands

### Modern Stack Development
```bash
# Setup environment
cd /mnt/c/xampp/htdocs/Laburar
./setup-windows.bat

# Start Next.js frontend
cd frontend && npm run dev
# → http://localhost:3000

# Start NestJS backend  
cd backend && npm run start:dev
# → http://localhost:3001/docs (Swagger)

# Database operations
cd backend
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed data
```

### Production Deployment
```bash
# Docker containerization
docker-compose -f docker-compose.prod.yml up -d

# AWS deployment
aws ecs update-service --cluster laburemos --service frontend
aws ecs update-service --cluster laburemos --service backend

# GCP deployment  
gcloud run deploy frontend --source=frontend
gcloud run deploy backend --source=backend
```

## Integration Points

### Frontend ↔ Backend API
- **Base URL**: `http://localhost:3001/api`
- **Authentication**: Bearer JWT tokens
- **Endpoints**: `/auth`, `/users`, `/projects`, `/payments`
- **WebSocket**: Real-time messaging and notifications

### Database Connections
- **PostgreSQL**: Primary database for modern stack
- **MySQL**: Legacy database (preserved)
- **Redis**: Session storage and caching
- **Prisma**: Type-safe database access

### External Services
- **Stripe**: Payment processing and subscriptions
- **AWS S3**: File storage and CDN
- **SendGrid**: Email notifications
- **Socket.io**: Real-time communications

## Development Tools

### Code Quality
- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks

### Testing
- **Jest**: Unit testing
- **Playwright**: E2E testing
- **Supertest**: API testing

### Deployment
- **Docker**: Containerization
- **GitHub Actions**: CI/CD pipeline
- **AWS ECS**: Container orchestration
- **GCP Cloud Run**: Serverless deployment

---

**Status**: Production Ready | **Next**: [CLAUDE-ARCHITECTURE.md](./CLAUDE-ARCHITECTURE.md) for system design