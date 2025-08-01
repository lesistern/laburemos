# Configuración rápida del backend para PostgreSQL local
Write-Host "=== Configurando Backend Local ===" -ForegroundColor Cyan

$PASSWORD = Read-Host "Ingresa tu contraseña de PostgreSQL local"

# Crear archivo .env para desarrollo local
$envContent = @"
# LABUREMOS - Configuración Local
NODE_ENV=development
PORT=3001

# Base de datos local PostgreSQL
DATABASE_URL="postgresql://postgres:$PASSWORD@localhost:5432/laburemos?schema=public"

# JWT para desarrollo
JWT_SECRET=local-development-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=local-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# CORS para desarrollo
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Email (opcional para desarrollo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=contacto.laburemos@gmail.com
"@

$envContent | Out-File -FilePath "backend\.env" -Encoding UTF8

Write-Host "✅ Archivo .env creado en backend\" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor Yellow
Write-Host "cd backend"
Write-Host "npm install"
Write-Host "npx prisma generate"
Write-Host "npx prisma db push"
Write-Host ""
Write-Host "Esto creará las tablas en tu base de datos local" -ForegroundColor Cyan