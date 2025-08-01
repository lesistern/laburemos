# LABUREMOS Development Patterns

**Coding Standards** | TypeScript | Production Patterns

## Code Organization

### Frontend Structure (Next.js 15.4.4)
```
frontend/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── [feature]/page.tsx    # Feature pages
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── layout/               # Layout components
│   └── [feature]/            # Feature-specific components
├── lib/
│   ├── api.ts                # API client
│   ├── auth.ts               # Authentication utilities
│   └── utils.ts              # Shared utilities
└── types/
    └── index.ts              # TypeScript definitions
```

### Backend Structure (NestJS)
```
backend/src/
├── [service]/
│   ├── [service].controller.ts  # HTTP endpoints
│   ├── [service].service.ts     # Business logic
│   ├── [service].module.ts      # Module definition
│   └── dto/                     # Data transfer objects
├── common/
│   ├── database/             # Prisma integration
│   ├── filters/              # Exception handling
│   └── interceptors/         # Request/response transformation
└── config/
    └── configuration.ts      # Environment configuration
```

## Development Workflow

### Daily Development Commands
```bash
# 1. Start development environment
cd /mnt/c/xampp/htdocs/Laburar
./start-windows.bat

# 2. Frontend development
cd frontend
npm run dev                # Start dev server → http://localhost:3000
npm run build              # Production build
npm run test               # Run tests
npm run lint               # Code linting

# 3. Backend development  
cd backend
npm run start:dev          # Start with hot reload → http://localhost:3001
npm run test               # Run unit tests
npm run test:e2e           # Run E2E tests
npm run db:migrate         # Apply database changes

# 4. Database operations
npm run db:generate        # Generate Prisma client
npm run db:seed            # Seed test data
npm run db:reset           # Reset database
```

## TypeScript Patterns

### API Client Pattern
```typescript
// /frontend/lib/api.ts
class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
  
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('accessToken')
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
      ...options,
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    return response.json()
  }
  
  // Typed methods
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.request('/projects')
  }
  
  async createProject(data: Omit<Project, 'id'>): Promise<ApiResponse<Project>> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const api = new ApiClient()
```

### Component Pattern
```typescript
// /frontend/components/ui/button.tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
            'border border-gray-300 bg-transparent': variant === 'outline',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4': size === 'md', 
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)

export { Button }
```

## NestJS Service Patterns

### Controller Pattern
```typescript
// /backend/src/project/project.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}
  
  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.projectService.findByUserId(user.id)
  }
  
  @Post()
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: User
  ) {
    return this.projectService.create(createProjectDto, user.id)
  }
}
```

### Service Pattern with Prisma
```typescript
// /backend/src/project/project.service.ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../common/database/prisma.service'

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}
  
  async create(createProjectDto: CreateProjectDto, userId: string) {
    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        userId,
      },
      include: {
        user: {
          select: { id: true, email: true, profile: true }
        }
      }
    })
  }
  
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        user: true,
        bids: {
          include: { user: true },
          orderBy: { amount: 'asc' }
        }
      }
    })
    
    if (!project) {
      throw new NotFoundException('Project not found')
    }
    
    return project
  }
}
```

## Testing Patterns

### Frontend Testing (Jest + React Testing Library)
```bash
# Run frontend tests
cd frontend
npm run test                 # Unit tests
npm run test:coverage        # Coverage report
npm run test:watch           # Watch mode
```

### Backend Testing (Jest + Supertest)
```bash
# Run backend tests
cd backend
npm run test                 # Unit tests
npm run test:e2e             # Integration tests
npm run test:cov             # Coverage report
```

## Database Patterns

### Prisma Schema Example
```prisma
// /backend/prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  profile   UserProfile?
  projects  Project[]
  bids      Bid[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users")
}

model Project {
  id          String   @id @default(cuid())
  title       String
  description String   @db.Text
  budget      Int
  status      ProjectStatus @default(DRAFT)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  bids        Bid[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("projects")
}

enum ProjectStatus {
  DRAFT
  PUBLISHED  
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

## Code Quality Standards

### Automated Checks
```bash
# Frontend quality checks
npm run lint                 # ESLint
npm run type-check          # TypeScript
npm run format              # Prettier
npm run build               # Build check

# Backend quality checks  
npm run lint                # ESLint
npm run test                # Unit tests
npm run build               # Build check
```

### Required Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality checks
- **Test Coverage**: Minimum 80% coverage required

---

**Status**: Production Patterns | **Next**: [CLAUDE-RULES.md](./CLAUDE-RULES.md) for critical requirements