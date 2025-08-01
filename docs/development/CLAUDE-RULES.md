# LABUREMOS Critical Requirements

**NON-NEGOTIABLE** | Production Rules | Security Standards

## Absolute Requirements

### 🚨 CRITICAL - Must Never Be Violated
1. **Modern Stack Priority**: Next.js/NestJS is PRIMARY stack, PHP/MySQL is legacy support only
2. **Database Integrity**: Never modify database schema without migration scripts
3. **Authentication Security**: All API endpoints must use JWT authentication except public routes
4. **Type Safety**: All TypeScript must compile without errors in strict mode
5. **Windows Compatibility**: All scripts and paths must work on Windows 11 with XAMPP

### 🔒 SECURITY - Zero Tolerance
1. **No Plain Text Passwords**: Use bcrypt with minimum 10 rounds
2. **JWT Token Security**: Access tokens expire in 15 minutes, refresh tokens in 7 days
3. **API Input Validation**: Validate all inputs using class-validator DTOs
4. **SQL Injection Prevention**: Only use Prisma ORM, never raw SQL queries
5. **CORS Configuration**: Restrict origins to localhost:3000 and production domains

### 📊 DATA INTEGRITY - Audit Required
1. **Backup Before Changes**: Always backup database before schema modifications
2. **Migration Scripts**: Database changes must use `npm run db:migrate`
3. **Transaction Boundaries**: Payment operations must use database transactions
4. **Data Validation**: Validate data at API layer and database constraints
5. **Audit Logging**: Log all critical operations (auth, payments, data changes)

## Development Rules

### Code Quality Standards
```bash
# REQUIRED before any commit
npm run lint        # Must pass ESLint
npm run type-check  # Must compile TypeScript
npm run test        # Must pass all tests
npm run build       # Must build successfully
```

### File Structure Enforcement
- **Frontend**: `/frontend/app/[feature]/page.tsx` for routes
- **Backend**: `/backend/src/[service]/[service].controller.ts` for APIs
- **Database**: `/backend/prisma/migrations/` for schema changes
- **Tests**: Co-locate with source files using `.test.ts` suffix

### API Development Rules
```typescript
// REQUIRED: All endpoints must follow this pattern
@Controller('resource')
@UseGuards(JwtAuthGuard)  // REQUIRED for protected routes
export class ResourceController {
  @Get()
  async findAll(@CurrentUser() user: User) {  // REQUIRED user context
    // Business logic here
  }
  
  @Post()
  async create(
    @Body() dto: CreateResourceDto,  // REQUIRED validation DTO
    @CurrentUser() user: User
  ) {
    // Implementation
  }
}
```

### Database Rules
```bash
# REQUIRED workflow for database changes
cd backend
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Apply migrations (production-safe)
npm run db:seed        # Seed test data (development only)

# FORBIDDEN operations
# - Never edit schema.prisma directly in production
# - Never run db:reset on production data
# - Never bypass Prisma ORM for data operations
```

## Service URLs - IMMUTABLE
| Service | URL | Purpose | Status |
|---------|-----|---------|---------|
| Next.js Frontend | http://localhost:3000 | PRIMARY interface | Production |
| NestJS Backend | http://localhost:3001 | PRIMARY API | Production |
| Legacy PHP | http://localhost/Laburar | LEGACY support | Functional |
| Database Admin | http://localhost/phpmyadmin | LEGACY management | Operational |

## Environment Setup Requirements

### Windows Development (MANDATORY)
```bash
# REQUIRED setup sequence
cd C:\xampp\htdocs\Laburar
./setup-windows.bat     # Initial setup
./start-windows.bat     # Daily startup

# REQUIRED services
# - XAMPP (Apache, MySQL)
# - Node.js 18+
# - PostgreSQL 15+
# - Redis 7+
```

### Production Deployment (STRICT)
```bash
# REQUIRED checks before deployment
npm run build           # Frontend build
npm run test:e2e        # E2E tests pass
npm run db:generate     # Database client updated
docker-compose build    # Container builds
```

## Error Handling Requirements

### Frontend Error Boundaries
```typescript
// REQUIRED: All page components must have error boundaries
export default function PageComponent() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      {/* Page content */}
    </ErrorBoundary>
  )
}
```

### Backend Exception Handling
```typescript
// REQUIRED: All services must handle exceptions
@Injectable()
export class Service {
  async operation(): Promise<Result> {
    try {
      // Business logic
    } catch (error) {
      this.logger.error('Operation failed', error.stack)
      throw new BadRequestException('Descriptive error message')
    }
  }
}
```

## Performance Requirements

### Response Time Limits
- **API Endpoints**: < 200ms average response time
- **Database Queries**: < 100ms average query time
- **Page Loads**: < 3s initial load, < 1s subsequent navigation
- **Real-time Messages**: < 50ms latency

### Resource Limits
- **Frontend Bundle**: < 500KB initial, < 2MB total
- **Memory Usage**: < 512MB per service container
- **Database Connections**: < 100 concurrent connections
- **File Uploads**: < 10MB per file, < 100MB total per user

## Testing Requirements

### Minimum Coverage
- **Unit Tests**: 80% code coverage minimum
- **Integration Tests**: All API endpoints tested
- **E2E Tests**: Critical user journeys covered
- **Performance Tests**: Load testing for peak usage

### Test Structure
```bash
# REQUIRED test organization
frontend/
├── components/__tests__/       # Component tests
├── pages/__tests__/           # Page tests
└── lib/__tests__/             # Utility tests

backend/src/
├── [service]/__tests__/       # Service tests
├── [service]/[controller].spec.ts  # Controller tests
└── test/                      # E2E tests
```

## Deployment Requirements

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Monitoring and logging configured
- [ ] Backup procedures verified
- [ ] Security scan passed
- [ ] Performance test passed
- [ ] Rollback plan documented

### Rollback Procedures
```bash
# REQUIRED rollback capability
git tag v1.0.0              # Tag releases
docker tag image backup     # Backup containers
pg_dump > backup.sql        # Database backup
```

## Monitoring Requirements

### Health Checks (MANDATORY)
```bash
# REQUIRED endpoints
GET /health              # Application health
GET /health/db          # Database connectivity  
GET /health/redis       # Cache connectivity
GET /metrics            # Prometheus metrics
```

### Logging Standards
```typescript
// REQUIRED logging format
this.logger.log('Operation completed', {
  userId: user.id,
  operation: 'create_project',
  projectId: project.id,
  timestamp: new Date().toISOString()
})
```

## Violation Consequences

### Automatic Enforcement
- **CI/CD Pipeline**: Blocks deployment if rules violated
- **Pre-commit Hooks**: Prevents commits with linting errors
- **Type Checking**: Compilation failures block builds
- **Test Requirements**: Failed tests block deployment

### Manual Review Required
- **Security Changes**: Require security team approval
- **Database Schema**: Require DBA review
- **Performance Changes**: Require performance testing
- **API Changes**: Require API documentation updates

---

**Status**: ENFORCED | **Violation Protocol**: Fix immediately or rollback | **Next**: [CLAUDE-IMPLEMENTATION.md](../sessions/CLAUDE-IMPLEMENTATION.md) for current status