# Configuración de Base de Datos en la Nube para LABUREMOS

## PlanetScale (MySQL) - Configuración Rápida

### 1. Crear cuenta en PlanetScale
1. Ir a https://planetscale.com
2. Sign up con GitHub
3. Crear nueva database: "laburemos-db"

### 2. Obtener credenciales
```bash
# En PlanetScale Dashboard:
# Settings > Passwords > New Password
# Copiar el connection string
```

### 3. Actualizar Backend (.env)
```env
# backend/.env
DATABASE_URL="mysql://[username]:[password]@[host]/laburemos-db?ssl={"rejectUnauthorized":true}"
DB_TYPE=mysql
DB_HOST=[host].psdb.cloud
DB_PORT=3306
DB_USERNAME=[username]
DB_PASSWORD=[password]
DB_DATABASE=laburar-db
```

### 4. Migrar esquema
```bash
cd backend
# Importar esquema a PlanetScale
npx prisma db push
```

## Supabase (PostgreSQL) - Configuración Rápida

### 1. Crear proyecto en Supabase
1. Ir a https://supabase.com
2. New Project > "laburar"
3. Copiar Database URL

### 2. Actualizar configuración
```env
# backend/.env
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
DB_TYPE=postgres
```

### 3. Beneficios extra de Supabase
- Auth integrado
- Realtime subscriptions
- Storage para archivos
- Edge Functions

## AWS RDS - Configuración Completa

### 1. Crear instancia RDS
```bash
# AWS CLI
aws rds create-db-instance \
  --db-instance-identifier laburar-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password [password] \
  --allocated-storage 20
```

### 2. Configurar Security Group
- Permitir puerto 3306 desde tu IP
- O usar VPC con Lambda/EC2

### 3. Connection string
```env
DATABASE_URL="mysql://admin:[password]@[endpoint].rds.amazonaws.com:3306/laburar"
```

## Comparación de Opciones

| Servicio | Free Tier | Pros | Contras |
|----------|-----------|------|---------|
| **PlanetScale** | 5GB | Branching, Serverless | Solo MySQL |
| **Supabase** | 500MB | Auth+Storage incluido | Límite pequeño |
| **Neon** | 3GB | PostgreSQL branching | Relativamente nuevo |
| **AWS RDS** | 750h/mes | Full control, reliable | Más complejo |
| **Oracle** | 20GB x2 | Muy generoso | Setup complejo |

## Migración desde Local

### 1. Exportar datos locales
```bash
# Desde XAMPP
mysqldump -u root laburar_db > laburar_backup.sql
```

### 2. Importar a cloud
```bash
# PlanetScale
pscale database restore laburar-db main --file=laburar_backup.sql

# Supabase (usar GUI)
# Database > SQL Editor > Paste & Run

# AWS RDS
mysql -h [endpoint] -u admin -p laburar < laburar_backup.sql
```

## Configuración para Producción

### Variables de entorno recomendadas
```env
# backend/.env.production
NODE_ENV=production
DATABASE_URL=[cloud-connection-string]
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_SSL=true

# Connection pooling para serverless
DATABASE_CONNECTION_LIMIT=5
```

### Prisma config para cloud
```prisma
// backend/prisma/schema.prisma
datasource db {
  provider = "mysql" // o "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma" // Para PlanetScale
}
```

## Scripts de migración

### migrate-to-cloud.js
```javascript
const { execSync } = require('child_process');
require('dotenv').config();

// Backup local
execSync('mysqldump -u root laburar_db > backup.sql');

// Restore to cloud
if (process.env.DB_TYPE === 'mysql') {
  execSync(`mysql -h ${process.env.DB_HOST} -u ${process.env.DB_USERNAME} -p${process.env.DB_PASSWORD} ${process.env.DB_DATABASE} < backup.sql`);
} else {
  execSync(`psql ${process.env.DATABASE_URL} < backup.sql`);
}

console.log('Migration complete!');
```

## Monitoreo y Optimización

### 1. Índices recomendados para cloud
```sql
-- Críticos para performance en cloud
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_projects_status_date ON projects(status, created_at);
CREATE INDEX idx_services_user_category ON services(user_id, category_id);
```

### 2. Connection pooling
```javascript
// backend/src/common/database/prisma.service.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  errorFormat: 'minimal',
});

// Para serverless
export const prismaServerless = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=1',
    },
  },
});
```

## Costos Estimados

### Desarrollo (Free Tiers)
- PlanetScale: $0 (5GB)
- Supabase: $0 (500MB)
- Neon: $0 (3GB)

### Producción (Pequeña escala)
- PlanetScale: $29/mes (10GB)
- Supabase: $25/mes (8GB)
- AWS RDS: $15-30/mes (db.t3.micro)

### Producción (Escala media)
- PlanetScale: $59/mes (50GB)
- AWS RDS: $50-100/mes (db.t3.small)
- AWS Aurora: $0.10/GB/mes (serverless)

## Recomendación para LABUREMOS

1. **Desarrollo**: PlanetScale Free (MySQL) o Supabase Free (PostgreSQL)
2. **MVP/Beta**: PlanetScale Scaler ($29) o Supabase Pro ($25)
3. **Producción**: AWS RDS con read replicas o Aurora Serverless

## Comandos útiles

```bash
# Test connection
npx prisma db pull

# Push schema
npx prisma db push

# Generate client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```