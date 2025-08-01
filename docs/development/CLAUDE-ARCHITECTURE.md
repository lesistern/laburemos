# LABUREMOS System Architecture

**Dual Stack Architecture** | Microservices | Production Ready

## Architecture Overview

### High-Level System Design
```
┌───────────────────────┐
│   MODERN STACK (PRIMARY)    │
├───────────────────────┤
│ Next.js 15.4.4 Frontend   │ ← http://localhost:3000
│         │               │
│         v               │
│ NestJS Microservices    │ ← http://localhost:3001
│         │               │
│         v               │
│ PostgreSQL + Redis      │
└───────────────────────┘

┌───────────────────────┐
│   LEGACY STACK (SUPPORT)   │  
├───────────────────────┤
│ PHP 8.2 + jQuery        │ ← http://localhost/Laburar
│         │               │
│         v               │
│ MySQL 8.0 Database      │
└───────────────────────┘
```

## Microservices Architecture

### Service Breakdown
| Service | Purpose | Database | Status |
|---------|---------|----------|--------|
| **Auth Service** | JWT authentication, password management | PostgreSQL | ✅ Production |
| **User Service** | Profile management, preferences | PostgreSQL | ✅ Production |
| **Project Service** | Gig creation, management | PostgreSQL | ✅ Production |
| **Payment Service** | Stripe integration, transactions | PostgreSQL | ✅ Production |
| **Notification Service** | Real-time notifications, WebSocket | Redis | ✅ Production |

### Service Communication
```
Next.js Frontend
    │
    v (HTTP/WebSocket)
Nginx Load Balancer
    │
    v
NestJS API Gateway
    │
    ├── Auth Service
    ├── User Service  
    ├── Project Service
    ├── Payment Service
    └── Notification Service
         │
         v
   PostgreSQL + Redis
```

## Data Architecture

### Database Schema
```sql
-- Core Entities
users (id, email, profile_data, created_at)
projects (id, user_id, title, description, budget)
payments (id, project_id, amount, stripe_payment_id)
notifications (id, user_id, message, read_at)

-- Authentication
user_sessions (id, user_id, refresh_token, expires_at)
password_resets (id, user_id, token, expires_at)

-- Business Logic  
user_profiles (user_id, bio, skills, portfolio_url)
project_bids (id, project_id, user_id, amount, proposal)
reviews (id, project_id, reviewer_id, rating, comment)
```

### Caching Strategy
- **Redis**: Session storage, frequent queries
- **Application**: In-memory caching for static data
- **Database**: Query result caching
- **CDN**: Static asset delivery

## Security Architecture

### Authentication Flow
```
1. User login → POST /auth/login
2. JWT access token (15min) + refresh token (7d)
3. Protected routes validate JWT
4. Refresh token rotation on renewal
5. Logout → invalidate all tokens
```

### Security Measures
- **HTTPS**: TLS 1.3 encryption
- **CORS**: Configured origins
- **Rate Limiting**: API endpoint protection
- **Input Validation**: DTO validation with class-validator
- **SQL Injection**: Prisma ORM protection
- **XSS**: CSP headers, input sanitization

## Deployment Architecture

### Production Environment
```
Internet
    │
    v
Cloudflare CDN
    │
    v
AWS Load Balancer
    │
    ├── ECS Cluster (Frontend)
    └── ECS Cluster (Backend)
         │
         v
    RDS PostgreSQL
    ElastiCache Redis
```

### Container Strategy
- **Frontend**: Next.js static build + Nginx
- **Backend**: Node.js NestJS application
- **Database**: Managed RDS PostgreSQL
- **Cache**: Managed ElastiCache Redis

## Performance Architecture

### Optimization Strategies
| Layer | Optimization | Implementation |
|-------|-------------|----------------|
| **Frontend** | Code splitting | Next.js dynamic imports |
| **API** | Response caching | Redis + HTTP headers |
| **Database** | Query optimization | Prisma with indexes |
| **Assets** | CDN delivery | CloudFront distribution |
| **Images** | Lazy loading | Next.js Image component |

### Performance Targets
- **Page Load**: <3s on 3G, <1s on WiFi
- **API Response**: <200ms average
- **Database Queries**: <100ms average  
- **Real-time Messages**: <50ms latency

## Monitoring Architecture

### Observability Stack
- **Logging**: Winston + CloudWatch
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **Alerting**: CloudWatch Alarms
- **Error Tracking**: Sentry integration

### Health Checks
```
GET /health        # Application health
GET /health/db     # Database connectivity
GET /health/redis  # Cache connectivity
GET /metrics       # Prometheus metrics
```

## Development Architecture

### Local Development
```bash
# Start all services
docker-compose up -d postgres redis
cd frontend && npm run dev
cd backend && npm run start:dev
```

### Testing Strategy
- **Unit Tests**: Jest for business logic
- **Integration Tests**: Supertest for APIs
- **E2E Tests**: Playwright for user workflows
- **Performance Tests**: Artillery for load testing

---

**Status**: Production Ready | **Next**: [CLAUDE-DEVELOPMENT.md](./CLAUDE-DEVELOPMENT.md) for coding patterns