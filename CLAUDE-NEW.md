# LaburAR - Quick Reference Guide

## Primary Entry Points

**Start Here**: [PROJECT-INDEX.md](./PROJECT-INDEX.md) - Complete project overview

## Documentation Structure

### Core Documentation (Root Directory)
| File | Purpose | Read When |
|------|---------|-----------|
| [PROJECT-INDEX.md](./PROJECT-INDEX.md) | Master project index | First time setup |
| **CLAUDE.md** | Main entry point and quick reference | Always start here |

### Organized Documentation (`docs/` directory)
| Category | Location | Purpose |
|----------|----------|---------|
| **Development** | [docs/development/](./docs/development/) | Technical guides and architecture |
| **Sessions** | [docs/sessions/](./docs/sessions/) | Development session history |
| **Archive** | [docs/archive/](./docs/archive/) | Historical documentation |
| **API** | [docs/api/](./docs/api/) | API and service documentation |
| **Deployment** | [docs/deployment/](./docs/deployment/) | Infrastructure and deployment |

### Development Documentation
| File | Purpose | Read When |
|------|---------|-----------|
| [docs/development/CLAUDE-STACK.md](./docs/development/CLAUDE-STACK.md) | Technology stack details | Before development |
| [docs/development/CLAUDE-ARCHITECTURE.md](./docs/development/CLAUDE-ARCHITECTURE.md) | System architecture | Before coding |
| [docs/development/CLAUDE-DEVELOPMENT.md](./docs/development/CLAUDE-DEVELOPMENT.md) | Development patterns | During development |
| [docs/development/CLAUDE-RULES.md](./docs/development/CLAUDE-RULES.md) | Critical requirements | Always reference |

### Session Documentation
| File | Purpose |
|------|---------|
| [docs/sessions/CLAUDE-SESSIONS.md](./docs/sessions/CLAUDE-SESSIONS.md) | Session history and development log |
| [docs/sessions/CLAUDE-IMPLEMENTATION.md](./docs/sessions/CLAUDE-IMPLEMENTATION.md) | Implementation status tracking |

### Archive Documentation
| File | Purpose |
|------|---------|
| [docs/archive/DOCUMENTATION-MAP.md](./docs/archive/DOCUMENTATION-MAP.md) | Cross-references and navigation map |

## Quick Start

```bash
# 1. Read project overview
cat PROJECT-INDEX.md

# 2. Setup development environment
./setup-windows.bat

# 3. Start modern stack services
cd frontend && npm run dev
cd backend && npm run start:dev
```

## Current Status: Production Ready
- Frontend: Next.js 15.4.4 (47 files) - PRIMARY STACK
- Backend: NestJS microservices - PRIMARY STACK
- Database: PostgreSQL (modern), MySQL (legacy support)
- URLs: http://localhost:3000 (Next.js - MAIN INTERFACE), http://localhost/Laburar (PHP - Legacy)

## Priority Tasks

### Completed ✅
- Frontend: Next.js 15.4.4 migration complete (PRIMARY STACK)
- Backend: NestJS microservices architecture (PRIMARY STACK)
- Dashboard: Enterprise UI with liquid glass effects
- Database: PostgreSQL (PRIMARY) + MySQL (legacy support)
- Windows: Automated setup scripts
- **OpenMoji Emoji System**: 4,284 categorized emojis with full API integration
- **Predictive Search System**: Barra de búsqueda inteligente con sugerencias en tiempo real
- **Landing Page UX**: Diseño optimizado y más compacto, eliminación de secciones redundantes
- **Categories Page**: Rediseño completo con grid de 4 columnas, imágenes 16:9 y boxes compactos
- **Categories Data**: Servicios reales integrados desde categorias.txt para todas las subcategorías
- **Documentation Organization**: Structured docs into logical hierarchy under `docs/` directory

### Pending Tasks

#### 🚨 **CRITICAL** (Core Functionality)
1. **Modern Stack Integration**
   - Connect Next.js (port 3000) with NestJS (port 3001)
   - Configure API calls from React to NestJS endpoints
   - Integrate authentication system between modern stacks

2. **Full Data Migration**
   - Complete migration from MySQL (legacy) to PostgreSQL (modern)
   - Update all database connections to use PostgreSQL
   - Maintain data integrity during transition

3. **API Authentication & Security**
   - JWT/OAuth integration between services
   - Protect NestJS endpoints
   - Configure CORS appropriately

#### 📈 **IMPORTANT** (User Experience)
4. **Real-time Features**
   - WebSockets for real-time messaging
   - Push notifications
   - Online/offline user status

5. **File Management System**
   - Upload/storage of files (CVs, images)
   - CDN integration for assets
   - Image optimization and processing

6. **E2E Testing**
   - Playwright/Cypress tests for complete workflows
   - Frontend ↔ Backend integration testing
   - Automated testing pipeline

#### ⚡ **OPTIMIZATION** (Performance & Quality)
7. **Performance Optimization**
   - Database query optimization
   - API response caching
   - Frontend bundle optimization
   - Image lazy loading

8. **Payment Integration**
   - Integrate Stripe for subscriptions
   - Billing dashboard
   - Payment webhooks

#### 🚀 **DEPLOYMENT** (Production)
9. **Production Deployment**
   - Complete Docker containerization
   - CI/CD pipeline with GitHub Actions
   - Cloud deployment (AWS/GCP)
   - SSL certificates and domain setup

10. **Monitoring & Analytics**
    - Error tracking (Sentry/similar)
    - Performance monitoring
    - User analytics
    - Database monitoring

**Next Recommended Task**: Complete the **Modern Stack Integration** to finalize the transition from legacy to modern architecture.

See [docs/sessions/CLAUDE-IMPLEMENTATION.md](./docs/sessions/CLAUDE-IMPLEMENTATION.md) for detailed implementation status.

## Technical Architecture

### Modern Stack (PRIMARY)
- **Frontend**: Next.js 15.4.4 + TypeScript + Tailwind (47 files)
- **Backend**: NestJS microservices + PostgreSQL + Redis + Stripe
- **DevOps**: Docker + GitHub Actions + AWS/GCP

### Legacy Stack (Support Only)
- **Backend**: PHP 8.2 + MySQL (maintained for backward compatibility)

### Modern Stack Quick Start
```batch
# Windows setup
cd C:\xampp\htdocs\Laburar
setup-windows.bat

# Start frontend (Next.js)
cd frontend
npm run dev

# Start backend (NestJS)
cd backend
npm run start:dev
```

### Service URLs
| Service | URL | Priority | Purpose |
|---------|-----|----------|----------|
| Next.js Frontend | http://localhost:3000 | PRIMARY | Main application |
| NestJS Backend | http://localhost:3001/docs | PRIMARY | API documentation |
| Legacy PHP | http://localhost/Laburar | LEGACY | Original platform |
| MySQL Admin | http://localhost/phpmyadmin | LEGACY | Legacy database management |
| PostgreSQL | http://localhost:8080 | PRIMARY | Modern database |
| **Emoji API** | http://localhost:3001/api/emojis | PRIMARY | OpenMoji emoji system |
| **Emoji Test** | http://localhost:3000/emoji-test | PRIMARY | API testing interface |

Full architecture details: [docs/development/CLAUDE-STACK.md](./docs/development/CLAUDE-STACK.md)

## Documentation System

This file serves as the main entry point. Detailed documentation is organized across the `docs/` directory:

### Core Documentation Navigation
- **Development Guides**: Technical architecture, stack details, development patterns → [docs/development/](./docs/development/)
- **Session History**: Development logs, implementation tracking → [docs/sessions/](./docs/sessions/)
- **Archive**: Historical documentation, cross-references → [docs/archive/](./docs/archive/)
- **API Documentation**: Service guides, endpoint documentation → [docs/api/](./docs/api/)
- **Deployment**: Infrastructure, deployment guides → [docs/deployment/](./docs/deployment/)

## Recent Updates

### Documentation Organization (2025-07-29)
- **Structure Reorganization**: Created organized `docs/` directory structure
  - `docs/development/` - Technical guides and architecture documentation
  - `docs/sessions/` - Development session history and implementation tracking
  - `docs/archive/` - Historical documentation and cross-references
  - `docs/api/` - API documentation and service guides
  - `docs/deployment/` - Infrastructure and deployment documentation
- **Root Cleanup**: Moved non-essential documentation to organized structure
- **Navigation Updates**: Updated all cross-references and navigation links
- **Accessibility**: Maintained documentation accessibility while reducing root clutter

### Categories Page Optimization (2025-07-29)
- **Categories Grid Layout**: Rediseño completo usando categorias.txt como guía
  - Grid de 4 columnas (2 en móvil, 3 en tablet, 4 en desktop)
  - Boxes más compactos: altura reducida de h-80 a h-64
  - Imágenes con aspect ratio 16:9 (640x360px) para mejor consistencia visual
  - Emojis optimizados para renderizado liso sin filtros adicionales
  - Solo 2 subcategorías mostradas por card para mejor UX
- **Subcategories Pages**: Rediseño uniforme para todas las subcategorías
  - Grid compacto de 4 columnas para mejor aprovechamiento del espacio
  - Cards con header gradiente azul y contenido optimizado
  - Solo 4 servicios mostrados por card con texto truncado
  - Diseño responsivo mejorado para móviles y tablets
- **Responsive Design**: Mejor adaptación a diferentes tamaños de pantalla
- **Performance**: URLs de imágenes optimizadas con parámetros 16:9
- **Real Services Data**: Integración completa de servicios reales desde categorias.txt
  - 5 categorías de Tendencias con 37 servicios específicos
  - 12 subcategorías de Artes gráficas con 85+ servicios detallados
  - 10 subcategorías de Programación con 60+ servicios técnicos
  - 7 subcategorías de Marketing digital con 45+ servicios especializados
  - 10 subcategorías de Video y animación con 55+ servicios creativos
  - 8 subcategorías de Escritura con 45+ servicios de contenido
  - 7 subcategorías de Música y audio con 35+ servicios profesionales
  - 6 subcategorías básicas de Negocios para completar estructura

### UI/UX Improvements & Search Enhancement (2025-07-29)
- **Predictive Search System**: Barra de búsqueda inteligente con sugerencias predictivas
  - Icono de lupa negro en header
  - Botón flecha derecha para control por mouse
  - Dropdown con sugerencias basadas en categorías y servicios populares
  - Funcional en desktop y móvil con animaciones suaves
- **Landing Page Optimizations**: 
  - Eliminada sección "Explora categorías" para diseño más limpio
  - Sección "¿Por qué elegir LaburAR?" rediseñada: más compacta y profesional
  - Cards horizontales con mejor aprovechamiento del espacio
  - Estadísticas profesionales reemplazando beneficios largos

### OpenMoji Emoji System Implementation (2025-07-28)
- **OpenMoji Integration**: 4,284 emojis from OpenMoji 15.1.0 repository
- **API System**: Complete REST API with categorization, search, and stats endpoints
- **Frontend Component**: React emoji picker with OpenMoji SVG support and fallback
- **Categories**: 8 categories (people, nature, food, activities, travel, objects, symbols)
- **Test Interface**: API verification interface at `/emoji-test`

### Modern Stack Migration Complete (2025-07-28)
- **Frontend**: Next.js 15.4.4 (PRIMARY STACK, 47 files)
- **Backend**: NestJS microservices architecture (PRIMARY STACK)
- **Database**: PostgreSQL (PRIMARY) with Redis caching
- **DevOps**: Docker + CI/CD pipeline
- **Windows**: Automated setup scripts for modern stack
- **UX**: Liquid glass effects fully implemented in React components

### Enterprise Dashboard Implementation (2025-07-26)
- **UI**: Professional color palette (#2563eb, #10b981), WCAG AA compliant
- **UX**: Liquid glass effects with React/Framer Motion, responsive grid
- **Features**: Chart.js analytics, badge system integration, mobile-first

### Previous Updates (2025-07-25)
- **Documentation**: Updated for modern stack (89 changes across 12 files)
- **Authentication**: JWT-based auth with refresh tokens in NestJS
- **Database**: PostgreSQL schema with Prisma ORM integration
- **Badge System**: Enterprise badges with 100 Founder badges implemented in React components

### Modern Database Setup
```bash
# PostgreSQL setup with Prisma
cd C:\xampp\htdocs\Laburar\backend
npm run db:generate
npm run db:migrate
npm run db:seed

# Legacy database (if needed)
http://localhost/Laburar/database/setup_database.php
```

Complete implementation details: [docs/sessions/CLAUDE-SESSIONS.md](./docs/sessions/CLAUDE-SESSIONS.md)