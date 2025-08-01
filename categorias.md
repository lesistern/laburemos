# LaburAR Categories System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Category Structure](#category-structure)
3. [Data Structure](#data-structure)
4. [Database Schema](#database-schema)
5. [Admin Panel Implementation](#admin-panel-implementation)
6. [API Endpoints](#api-endpoints)
7. [Frontend Implementation](#frontend-implementation)
8. [Implementation Roadmap](#implementation-roadmap)

## Overview

The LaburAR categories system organizes freelance services into a hierarchical structure with main categories and subcategories. The system supports dynamic content management through an admin panel and provides a user-friendly interface for browsing available services.

### Key Features
- **Hierarchical Organization**: Main categories with subcategories
- **Service Listings**: Each subcategory contains specific services
- **Dynamic Management**: Admin panel for CRUD operations
- **Search Integration**: Predictive search across categories and services
- **Responsive Design**: Mobile-first approach with 4-column grid layout
- **Real Data Integration**: Based on actual service offerings from categorias.txt

## Category Structure

The system currently implements 8 main categories with varying numbers of subcategories:

### 1. Tendencias (5 subcategories) - **ACTUALIZACIÓN SEMANAL AUTOMÁTICA**
- **Servicios de IA**
- **Criptomonedas y blockchain**
- **NFT**
- **Desarrollo de chatbots**
- **Realidad virtual**

> **Nota importante**: La categoría "Tendencias" se actualiza automáticamente cada semana (domingo 23:59 GMT-3) basándose en los servicios más utilizados, búsquedas populares y métricas de engagement de la plataforma. Los servicios más populares de otras categorías son promovidos automáticamente a "Tendencias".

### 2. Artes gráficas (12 subcategories)
- **Diseño de logos e identidad de marca**
- **Brochures y catálogos**
- **Diseño de packaging y etiquetas**
- **Diseño para impresión**
- **Postales, flyers e invitaciones**
- **Edición y postproducción**
- **Vectorización**
- **Diseño de fuentes y tipografías**
- **Diseño de presentaciones**
- **Infografías**
- **Ilustración**
- **Diseño de patrones**

### 3. Programación (10 subcategories)
- **Desarrollo web**
- **Desarrollo móvil**
- **Desarrollo de escritorio**
- **Desarrollo de videojuegos**
- **E-commerce**
- **Bases de datos**
- **Ciberseguridad**
- **Aplicaciones de IA**
- **Scripts y utilidades**
- **Testing y QA**

### 4. Marketing digital (7 subcategories)
- **Redes sociales**
- **Métodos de pago**
- **Influencers**
- **Marketing de afiliación**
- **Optimización de motores de búsqueda (SEO)**
- **Marketing de contenidos**
- **Email marketing**

### 5. Video y animación (10 subcategories)
- **Edición de video**
- **Video animado**
- **Video promocional**
- **Guiones**
- **Video testimonial**
- **Visualización de datos**
- **Crowdfunding**
- **Producto demo**
- **Fotografía de productos**
- **Retratos y fotos de estilo de vida**

### 6. Escritura (8 subcategories)
- **Artículos y posts para blog**
- **Redacción publicitaria**
- **Casos de estudio**
- **Libros electrónicos**
- **Comunicados de prensa**
- **Transcripción**
- **Currículums y cartas de presentación**
- **Contenido web**

### 7. Música y audio (7 subcategories)
- **Producción musical**
- **Locución**
- **Jingles y música de marca**
- **Traducción y localización**
- **Composición musical**
- **Edición de audio**
- **Sonido para videojuegos**

### 8. Negocios (6 subcategories)
- **Consultoría empresarial**
- **Análisis de datos**
- **Presentaciones empresariales**
- **Investigación de mercado**
- **Planes de negocio**
- **Servicios legales**

## Data Structure

### Category Object
```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // OpenMoji emoji
  image: string; // Featured image URL
  subcategories: Subcategory[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Subcategory Object
```typescript
interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // OpenMoji emoji
  image: string; // Featured image URL
  services: Service[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Service Object
```typescript
interface Service {
  id: string;
  subcategoryId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  currency: string;
  deliveryTime: number; // in days
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  // Trending metrics for automatic promotion
  weeklyViews: number;
  weeklyOrders: number;
  weeklySearches: number;
  trendingScore: number; // calculated weekly
  lastTrendingUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Database Schema

### PostgreSQL Schema Design

```sql
-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- OpenMoji code
    image VARCHAR(500), -- Image URL
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subcategories table
CREATE TABLE subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100), -- OpenMoji code
    image VARCHAR(500), -- Image URL
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, slug)
);

-- Services table
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    subcategory_id INTEGER REFERENCES subcategories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    base_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'ARS',
    delivery_time INTEGER DEFAULT 7, -- in days
    tags TEXT[], -- PostgreSQL array
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    -- Trending metrics for weekly updates
    weekly_views INTEGER DEFAULT 0,
    weekly_orders INTEGER DEFAULT 0,
    weekly_searches INTEGER DEFAULT 0,
    trending_score DECIMAL(5,2) DEFAULT 0.0, -- calculated weekly
    last_trending_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subcategory_id, slug)
);

-- Indexes for performance
CREATE INDEX idx_categories_active ON categories(is_active, sort_order);
CREATE INDEX idx_subcategories_category ON subcategories(category_id, is_active, sort_order);
CREATE INDEX idx_services_subcategory ON services(subcategory_id, is_active, sort_order);
CREATE INDEX idx_services_featured ON services(is_featured, is_active);
CREATE INDEX idx_services_tags ON services USING GIN(tags);
-- Trending system indexes
CREATE INDEX idx_services_trending_score ON services(trending_score DESC, is_active);
CREATE INDEX idx_services_weekly_metrics ON services(weekly_views, weekly_orders, weekly_searches);
CREATE INDEX idx_services_trending_update ON services(last_trending_update);

-- Full-text search indexes
CREATE INDEX idx_categories_search ON categories USING GIN(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_subcategories_search ON subcategories USING GIN(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_services_search ON services USING GIN(to_tsvector('spanish', name || ' ' || COALESCE(description, '') || ' ' || array_to_string(tags, ' ')));

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Weekly trending calculation function
CREATE OR REPLACE FUNCTION calculate_trending_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.trending_score = (
        (NEW.weekly_views * 0.3) +
        (NEW.weekly_orders * 0.5) +
        (NEW.weekly_searches * 0.2)
    ) / 100.0; -- Normalize to 0-100 scale
    
    NEW.last_trending_update = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_service_trending BEFORE UPDATE OF weekly_views, weekly_orders, weekly_searches ON services FOR EACH ROW EXECUTE FUNCTION calculate_trending_score();
```

### Prisma Schema Definition

```prisma
// prisma/schema.prisma
model Category {
  id            Int            @id @default(autoincrement())
  name          String         @db.VarChar(255)
  slug          String         @unique @db.VarChar(255)
  description   String?        @db.Text
  icon          String?        @db.VarChar(100)
  image         String?        @db.VarChar(500)
  isActive      Boolean        @default(true) @map("is_active")
  sortOrder     Int            @default(0) @map("sort_order")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")
  
  subcategories Subcategory[]
  
  @@index([isActive, sortOrder])
  @@map("categories")
}

model Subcategory {
  id          Int       @id @default(autoincrement())
  categoryId  Int       @map("category_id")
  name        String    @db.VarChar(255)
  slug        String    @db.VarChar(255)
  description String?   @db.Text
  icon        String?   @db.VarChar(100)
  image       String?   @db.VarChar(500)
  isActive    Boolean   @default(true) @map("is_active")
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  category    Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  services    Service[]
  
  @@unique([categoryId, slug])
  @@index([categoryId, isActive, sortOrder])
  @@map("subcategories")
}

model Service {
  id                  Int      @id @default(autoincrement())
  subcategoryId       Int      @map("subcategory_id")
  name                String   @db.VarChar(255)
  slug                String   @db.VarChar(255)
  description         String?  @db.Text
  shortDescription    String?  @db.VarChar(500) @map("short_description")
  basePrice           Decimal? @db.Decimal(10, 2) @map("base_price")
  currency            String   @default("ARS") @db.VarChar(3)
  deliveryTime        Int      @default(7) @map("delivery_time")
  tags                String[]
  isActive            Boolean  @default(true) @map("is_active")
  isFeatured          Boolean  @default(false) @map("is_featured")
  sortOrder           Int      @default(0) @map("sort_order")
  // Trending metrics
  weeklyViews         Int      @default(0) @map("weekly_views")
  weeklyOrders        Int      @default(0) @map("weekly_orders")
  weeklySearches      Int      @default(0) @map("weekly_searches")
  trendingScore       Decimal  @default(0.0) @db.Decimal(5, 2) @map("trending_score")
  lastTrendingUpdate  DateTime @default(now()) @map("last_trending_update")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")
  
  subcategory         Subcategory @relation(fields: [subcategoryId], references: [id], onDelete: Cascade)
  
  @@unique([subcategoryId, slug])
  @@index([subcategoryId, isActive, sortOrder])
  @@index([isFeatured, isActive])
  @@index([trendingScore, isActive])
  @@index([weeklyViews, weeklyOrders, weeklySearches])
  @@map("services")
}
```

## Admin Panel Implementation

### Admin Panel Features

#### 1. Category Management
- **List View**: Grid view with search, filter, and sort capabilities
- **Create/Edit**: Form with validation for all category fields
- **Drag & Drop Reordering**: Visual sort order management
- **Bulk Operations**: Activate/deactivate multiple categories
- **Image Management**: Upload and crop category images
- **Icon Selection**: OpenMoji emoji picker integration

#### 2. Subcategory Management
- **Hierarchical View**: Tree view showing category-subcategory relationships
- **Nested CRUD**: Create, edit, delete within category context
- **Service Count**: Display number of services per subcategory
- **Quick Actions**: Duplicate, move between categories
- **Bulk Import**: CSV import for mass subcategory creation

#### 3. Service Management
- **Advanced Filtering**: By category, subcategory, price range, status
- **Rich Text Editor**: For service descriptions
- **Tag Management**: Auto-complete tag system
- **Pricing Tools**: Bulk price updates, currency conversion
- **Analytics Integration**: View service performance metrics
- **Template System**: Service templates for faster creation

#### 4. System Features
- **Search & Analytics**: Full-text search across all entities
- **Audit Trail**: Track all changes with user attribution
- **Backup/Restore**: Database backup and restore functionality
- **Import/Export**: CSV and JSON import/export capabilities
- **Permission System**: Role-based access control
- **API Documentation**: Auto-generated API docs

#### 5. Trending System Management
- **Weekly Analytics Dashboard**: View trending metrics and algorithm performance
- **Trending Configuration**: Adjust trending score weights (views: 30%, orders: 50%, searches: 20%)
- **Manual Trending Override**: Manually promote/demote services from trending
- **Trending History**: Track trending changes over time with analytics
- **Algorithm Testing**: A/B test different trending algorithms
- **Trending Notifications**: Alert administrators of significant trending changes

### Admin Panel UI Components

#### Category Form Component
```typescript
// admin/components/CategoryForm.tsx
interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  image: File | string;
  isActive: boolean;
  sortOrder: number;
}
```

#### Service Management Table
```typescript
// admin/components/ServiceTable.tsx
interface ServiceTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
  onBulkAction: (action: string, serviceIds: string[]) => void;
  filters: ServiceFilters;
  onFilterChange: (filters: ServiceFilters) => void;
}

interface ServiceFilters {
  categoryId?: string;
  subcategoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  priceRange?: [number, number];
  tags?: string[];
  search?: string;
}
```

## API Endpoints

### NestJS Controllers

#### Categories Controller
```typescript
@Controller('api/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  @Get()
  findAll(@Query() query: CategoryQueryDto): Promise<Category[]>

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Category>

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category>

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto): Promise<Category>

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string): Promise<void>

  @Post('bulk-update')
  @UseGuards(AdminGuard)
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdateDto): Promise<Category[]>

  @Post('reorder')
  @UseGuards(AdminGuard)
  reorder(@Body() reorderDto: ReorderDto): Promise<void>
}
```

#### API Endpoint List

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/categories` | List all categories | No |
| GET | `/api/categories/:id` | Get category by ID | No |
| POST | `/api/categories` | Create new category | Admin |
| PUT | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Delete category | Admin |
| POST | `/api/categories/bulk-update` | Bulk update categories | Admin |
| POST | `/api/categories/reorder` | Reorder categories | Admin |
| GET | `/api/subcategories` | List subcategories | No |
| GET | `/api/subcategories/category/:categoryId` | Get subcategories by category | No |
| POST | `/api/subcategories` | Create subcategory | Admin |
| PUT | `/api/subcategories/:id` | Update subcategory | Admin |
| DELETE | `/api/subcategories/:id` | Delete subcategory | Admin |
| GET | `/api/services` | List services with filters | No |
| GET | `/api/services/:id` | Get service by ID | No |
| GET | `/api/services/subcategory/:subcategoryId` | Get services by subcategory | No |
| POST | `/api/services` | Create service | Admin |
| PUT | `/api/services/:id` | Update service | Admin |
| DELETE | `/api/services/:id` | Delete service | Admin |
| POST | `/api/services/bulk-update` | Bulk update services | Admin |
| GET | `/api/search` | Global search across categories | No |
| GET | `/api/search/suggestions` | Get search suggestions | No |
| POST | `/api/import/categories` | Import categories from CSV | Admin |
| POST | `/api/export/categories` | Export categories to CSV | Admin |
| GET | `/api/trending/services` | Get trending services with scores | No |
| POST | `/api/trending/update` | Manually trigger trending update | Admin |
| GET | `/api/trending/analytics` | Get trending analytics dashboard | Admin |
| POST | `/api/trending/override` | Manually promote/demote service | Admin |
| GET | `/api/trending/history` | Get trending history | Admin |

### API Response Examples

#### Category List Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "Artes gráficas",
      "slug": "artes-graficas",
      "description": "Servicios de diseño gráfico y visual",
      "icon": "1f3a8",
      "image": "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=640&h=360&fit=crop",
      "isActive": true,
      "sortOrder": 1,
      "subcategoriesCount": 12,
      "servicesCount": 85,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### Service Search Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "Diseño de logo profesional",
      "slug": "diseno-logo-profesional",
      "shortDescription": "Crear identidad visual única para tu marca",
      "basePrice": 15000,
      "currency": "ARS",
      "deliveryTime": 5,
      "tags": ["logo", "branding", "identidad"],
      "subcategory": {
        "id": 1,
        "name": "Diseño de logos e identidad de marca",
        "category": {
          "id": 2,
          "name": "Artes gráficas"
        }
      }
    }
  ],
  "filters": {
    "applied": {
      "categoryId": null,
      "priceRange": [0, 50000],
      "tags": []
    },
    "available": {
      "categories": [...],
      "priceRanges": [...],
      "tags": [...]
    }
  }
}
```

## Frontend Implementation

### Current Implementation Status

#### Pages Structure
```
/frontend/app/
├── categories/
│   ├── page.tsx                 # Main categories grid
│   └── [category]/
│       ├── page.tsx            # Category detail with subcategories
│       └── [subcategory]/
│           └── page.tsx        # Subcategory with services
```

#### Key Components
- **CategoryCard**: 4-column grid layout with 16:9 images
- **SubcategoryCard**: Compact design showing limited services
- **ServiceCard**: Individual service display
- **SearchBar**: Predictive search with dropdown suggestions

#### Responsive Design
- **Mobile**: 2 columns, compact cards
- **Tablet**: 3 columns, medium cards
- **Desktop**: 4 columns, full cards
- **Aspect Ratio**: Consistent 16:9 for all images

### Integration with Modern Stack

#### Next.js 15.4.4 Features
- App Router with dynamic routes
- Server Components for SEO optimization
- Client Components for interactive features
- Optimized images with next/image
- TypeScript integration

#### State Management
```typescript
// hooks/useCategories.ts
export const useCategories = () => {
  const { data, error, isLoading } = useSWR('/api/categories', fetcher);
  return { categories: data, error, isLoading };
};

// hooks/useSearch.ts
export const useSearch = (query: string) => {
  const { data, error, isLoading } = useSWR(
    query ? `/api/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  );
  return { results: data, error, isLoading };
};
```

## Implementation Roadmap

### Phase 1: Database Setup (Week 1)
- [ ] **PostgreSQL Schema**: Create tables with proper relationships
- [ ] **Prisma Integration**: Set up ORM with migrations
- [ ] **Seed Data**: Import existing categorias.txt data
- [ ] **Indexes**: Create performance indexes for search
- [ ] **Constraints**: Add data validation constraints

### Phase 2: Backend API (Week 2)
- [ ] **NestJS Controllers**: Implement CRUD operations
- [ ] **Validation**: Add DTO validation with class-validator
- [ ] **Authentication**: Protect admin endpoints
- [ ] **Search**: Implement full-text search
- [ ] **Pagination**: Add pagination and filtering
- [ ] **Trending System**: Implement weekly trending calculation
- [ ] **Analytics Tracking**: Add service view/order/search tracking
- [ ] **Cron Jobs**: Weekly trending update scheduler
- [ ] **Documentation**: Auto-generate API docs with Swagger

### Phase 3: Admin Panel (Week 3-4)
- [ ] **Admin Authentication**: JWT-based admin login
- [ ] **Category Management**: Full CRUD interface
- [ ] **Service Management**: Advanced service editor
- [ ] **Image Upload**: File upload with compression
- [ ] **Bulk Operations**: Import/export and bulk updates
- [ ] **Analytics Dashboard**: Usage statistics and insights
- [ ] **Trending Dashboard**: Weekly trending analytics and management
- [ ] **Trending Configuration**: Adjust algorithm weights and parameters
- [ ] **Manual Trending Control**: Override automatic trending decisions

### Phase 4: Frontend Integration (Week 5)
- [ ] **API Integration**: Connect Next.js with NestJS API
- [ ] **Search Enhancement**: Real-time search with API
- [ ] **Performance**: Implement caching and optimization
- [ ] **SEO**: Add metadata and structured data
- [ ] **Testing**: Unit and integration tests

### Phase 5: Advanced Features (Week 6-8)
- [ ] **User Favorites**: Save favorite services
- [ ] **Service Recommendations**: AI-powered suggestions
- [ ] **Price Comparison**: Compare similar services
- [ ] **Review System**: Service ratings and reviews
- [ ] **Analytics**: Track user behavior and popular services
- [ ] **Trending Frontend**: Dynamic trending section on homepage
- [ ] **Trending Indicators**: Visual trending badges on services
- [ ] **Weekly Trending Reports**: Email reports for administrators
- [ ] **Mobile App**: React Native implementation

### Phase 6: Production Deployment (Week 9-10)
- [ ] **Docker Configuration**: Containerize all services
- [ ] **CI/CD Pipeline**: Automated deployment
- [ ] **Monitoring**: Error tracking and performance monitoring
- [ ] **Backup Strategy**: Automated database backups
- [ ] **CDN Setup**: Asset delivery optimization
- [ ] **SSL/Security**: Security hardening and certificates

## Technical Considerations

### Performance Optimization
- **Database Indexing**: Full-text search indexes on Spanish content
- **Caching Strategy**: Redis for frequently accessed data
- **Image Optimization**: WebP format with multiple sizes
- **Lazy Loading**: Progressive loading of category images
- **API Optimization**: GraphQL for flexible data fetching

### Security Measures
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Prevention**: Parameterized queries with Prisma
- **XSS Protection**: Content sanitization
- **Rate Limiting**: API rate limiting for public endpoints
- **Admin Authentication**: Strong authentication for admin operations

### Scalability Planning
- **Database Sharding**: Plan for horizontal scaling
- **Microservices**: Separate services for different domains
- **CDN Integration**: Global asset distribution
- **Load Balancing**: Multiple instance deployment
- **Monitoring**: Performance and error monitoring

### Maintenance Considerations
- **Data Migration**: Scripts for schema updates
- **Backup/Restore**: Automated backup procedures
- **Version Control**: Database schema versioning
- **Documentation**: Keep technical documentation updated
- **Testing**: Comprehensive test coverage for all features

### Trending System Technical Specifications

#### Weekly Update Process
1. **Schedule**: Every Sunday at 23:59 GMT-3 (Argentina time)
2. **Duration**: Approximately 15-30 minutes depending on data volume
3. **Process**: 
   - Calculate trending scores for all active services
   - Identify top 25-50 trending services across all categories
   - Update "Tendencias" category with highest scoring services
   - Archive previous week's trending data
   - Send notification emails to administrators

#### Trending Algorithm Details
```sql
-- Trending score calculation (executed weekly)
UPDATE services SET 
  trending_score = (
    (weekly_views * 0.3) +
    (weekly_orders * 0.5) +
    (weekly_searches * 0.2)
  ) / 100.0,
  last_trending_update = CURRENT_TIMESTAMP;

-- Select top trending services for promotion
SELECT s.*, sc.name as subcategory_name, c.name as category_name
FROM services s
JOIN subcategories sc ON s.subcategory_id = sc.id
JOIN categories c ON sc.category_id = c.id
WHERE s.is_active = true
  AND c.slug != 'tendencias' -- Exclude already trending services
ORDER BY s.trending_score DESC
LIMIT 50;
```

#### Metrics Tracking Implementation
- **Views**: Increment when user visits service detail page
- **Orders**: Increment when user completes service purchase
- **Searches**: Increment when service appears in search results and is clicked
- **Reset**: All weekly metrics reset to 0 every Sunday after calculation

#### System Monitoring
- **Performance**: Weekly update process monitored for completion time
- **Data Quality**: Validate trending scores and detect anomalies
- **Error Handling**: Failsafe mechanisms if weekly update fails
- **Rollback**: Ability to revert trending changes if issues detected

This documentation provides a complete guide for implementing and maintaining the LaburAR categories system, including the dynamic weekly trending functionality, from database design to production deployment.