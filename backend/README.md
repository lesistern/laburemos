# LABUREMOS Backend API

Backend completo para la plataforma LABUREMOS construido con NestJS, PostgreSQL, Redis y Stripe.

## 🏗️ Arquitectura

### Microservicios
- **Auth Service**: Autenticación JWT + refresh tokens
- **User Service**: Gestión de usuarios y perfiles
- **Project Service**: Gestión de proyectos y ordenes
- **Payment Service**: Procesamiento de pagos con Stripe
- **Notification Service**: Notificaciones en tiempo real con WebSockets

### Stack Tecnológico
- **Framework**: NestJS v10
- **Base de Datos**: PostgreSQL 15
- **ORM**: Prisma
- **Cache**: Redis 7
- **Autenticación**: JWT + Passport
- **Pagos**: Stripe
- **Documentación**: OpenAPI/Swagger
- **WebSockets**: Socket.io
- **Contenedores**: Docker + Docker Compose

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- Docker y Docker Compose
- Git

### 1. Clonar y configurar
```bash
cd /mnt/c/xampp/htdocs/Laburemos/backend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### 2. Configurar variables de entorno
Editar `.env` con tus credenciales:

```env
# Database
DATABASE_URL="postgresql://laburemos_user:laburemos_password@localhost:5432/laburemos_db?schema=public"

# JWT (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-here-change-in-production

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Levantar infraestructura
```bash
# Levantar PostgreSQL y Redis
docker-compose up -d postgres redis

# Esperar a que estén listos
sleep 10
```

### 4. Configurar base de datos
```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Sembrar datos iniciales
npm run db:seed
```

### 5. Iniciar servidor
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 📚 Documentación API

Una vez iniciado el servidor, la documentación está disponible en:
- **Swagger UI**: http://localhost:3000/docs
- **JSON Schema**: http://localhost:3000/docs-json

## 🔐 Autenticación

### Registro de Usuario
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "MiPassword123!",
    "firstName": "Juan",
    "lastName": "Pérez",
    "userType": "CLIENT"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "MiPassword123!"
  }'
```

### Usar Token
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🛡️ Seguridad

### Características Implementadas
- ✅ JWT con refresh tokens
- ✅ Rate limiting (5 intentos/minuto para auth)
- ✅ Validación robusta de contraseñas
- ✅ Hash de contraseñas con bcrypt (12 rounds)
- ✅ Helmet para headers de seguridad
- ✅ CORS configurado
- ✅ Sanitización de logs (elimina datos sensibles)

### Validación de Contraseñas
Las contraseñas deben cumplir:
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula  
- Al menos 1 número
- Al menos 1 carácter especial
- No ser contraseñas comunes

## 💳 Pagos con Stripe

### Configuración
1. Crear cuenta en [Stripe](https://stripe.com)
2. Obtener claves API desde el dashboard
3. Configurar webhook endpoint: `POST /api/v1/payments/webhook`

### Crear Pago
```bash
curl -X POST http://localhost:3000/api/v1/payments/create-intent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "usd",
    "projectId": 1
  }'
```

## 🔔 Notificaciones en Tiempo Real

### WebSocket Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001/notifications', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});

socket.on('connected', (data) => {
  console.log('Conectado:', data);
});

socket.on('notification', (data) => {
  console.log('Nueva notificación:', data);
});
```

### Eventos Disponibles
- `notification` - Nueva notificación
- `project-update` - Actualización de proyecto
- `message` - Nuevo mensaje
- `payment-update` - Actualización de pago

## 🐳 Docker

### Levantar todo con Docker
```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Solo base de datos y cache
docker-compose up -d postgres redis

# Parar servicios
docker-compose down
```

### Servicios Disponibles
- **API Gateway**: http://localhost:3000
- **WebSocket**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **PgAdmin**: http://localhost:8080 (admin@laburemos.com.ar / admin123)
- **Redis Commander**: http://localhost:8081

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests con coverage
npm run test:cov

# Tests e2e
npm run test:e2e

# Watch mode
npm run test:watch
```

## 📊 Monitoreo

### Health Checks
- **API**: `GET /health`
- **Database**: `GET /health/database`
- **Redis**: `GET /health/redis`

### Logs
Los logs se almacenan en:
- `logs/app.log` - Logs generales
- `logs/error.log` - Solo errores
- Console - Desarrollo

### Métricas
- Tiempo de respuesta promedio
- Rate de errores
- Conexiones activas WebSocket
- Uso de memoria Redis

## 🔧 Desarrollo

### Scripts Disponibles
```bash
npm run start:dev     # Servidor de desarrollo
npm run build         # Build para producción
npm run lint          # Linter
npm run format        # Formatter
npm run db:generate   # Generar cliente Prisma
npm run db:migrate    # Ejecutar migraciones
npm run db:studio     # Abrir Prisma Studio
npm run db:seed       # Sembrar datos
```

### Estructura del Proyecto
```
src/
├── auth/             # Módulo de autenticación
├── user/             # Módulo de usuarios
├── project/          # Módulo de proyectos
├── payment/          # Módulo de pagos
├── notification/     # Módulo de notificaciones
├── common/           # Código compartido
│   ├── database/     # Configuración Prisma
│   ├── redis/        # Configuración Redis  
│   ├── filters/      # Filtros de excepciones
│   └── interceptors/ # Interceptores
├── config/           # Configuraciones
└── main.ts           # Punto de entrada

prisma/
├── schema.prisma     # Esquema de base de datos
└── seed.ts           # Datos iniciales
```

### Agregar Nuevo Endpoint
1. Crear DTO con validaciones
2. Agregar método al servicio
3. Crear endpoint en controlador
4. Documentar con Swagger decorators
5. Agregar tests

## 🚀 Deployment

### Variables de Entorno Producción
```env
NODE_ENV=production
JWT_SECRET=SUPER_SECURE_SECRET_KEY_PRODUCTION
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/prod_db
REDIS_HOST=prod_redis_host
STRIPE_SECRET_KEY=sk_live_your_live_key
```

### Build y Deploy
```bash
# Build
npm run build

# Ejecutar migraciones en producción
npx prisma migrate deploy

# Iniciar
npm run start:prod
```

## 🤝 Cuentas Demo

El seeder crea estas cuentas de prueba:

### Admin
- **Email**: admin@laburemos.com.ar  
- **Password**: admin123
- **Tipo**: Administrador

### Freelancer
- **Email**: freelancer@demo.com
- **Password**: demo123
- **Tipo**: Freelancer

### Cliente
- **Email**: client@demo.com
- **Password**: demo123  
- **Tipo**: Cliente

## 🆘 Troubleshooting

### Error: "Database connection failed"
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres
```

### Error: "Redis connection failed"
```bash
# Verificar Redis
docker-compose ps redis

# Testear conexión
redis-cli -h localhost -p 6379 ping
```

### Error: "JWT token expired"
- Los access tokens duran 15 minutos
- Usar refresh token para obtener nuevo access token
- Endpoint: `POST /api/v1/auth/refresh`

### Error: "Rate limit exceeded"  
- Auth: 5 intentos por minuto
- Esperar o usar diferentes IPs para testing

## 📝 Licencia

MIT - Ver archivo LICENSE para detalles.

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -m 'Agregar nueva característica'`)
4. Push branch (`git push origin feature/nueva-caracteristica`) 
5. Crear Pull Request

---

**Desarrollado con ❤️ para LABUREMOS**