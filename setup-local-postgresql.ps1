# Script para configurar PostgreSQL local con pgAdmin4
# LABUREMOS - Configuración Local

Write-Host "=== Configuración PostgreSQL Local - LABUREMOS ===" -ForegroundColor Cyan
Write-Host ""

# Configuración local
$LOCAL_HOST = "localhost"
$LOCAL_PORT = "5432"
$LOCAL_USER = "postgres"
$LOCAL_DB = "laburemos"

Write-Host "Información de conexión local:" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow
Write-Host "Host: $LOCAL_HOST"
Write-Host "Port: $LOCAL_PORT"
Write-Host "Database: $LOCAL_DB"
Write-Host "Username: $LOCAL_USER"
Write-Host ""

# Verificar si PostgreSQL está corriendo
Write-Host "Verificando PostgreSQL local..." -ForegroundColor Yellow

try {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if ($pgService) {
        Write-Host "✅ Servicio PostgreSQL encontrado: $($pgService.Name)" -ForegroundColor Green
        Write-Host "   Estado: $($pgService.Status)" -ForegroundColor Green
        
        if ($pgService.Status -ne "Running") {
            Write-Host "⚠️  PostgreSQL no está corriendo. Iniciando..." -ForegroundColor Yellow
            Start-Service $pgService.Name
        }
    } else {
        Write-Host "❌ PostgreSQL no encontrado como servicio" -ForegroundColor Red
        Write-Host "   Verifica si está instalado o corriendo con XAMPP" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error verificando PostgreSQL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Crear archivo de configuración para pgAdmin4
$configContent = @"
=== Configuración pgAdmin4 - LABUREMOS LOCAL ===

1. INFORMACIÓN DE CONEXIÓN LOCAL:
   --------------------------------
   Name: LaburAR Local Development
   Host: $LOCAL_HOST
   Port: $LOCAL_PORT
   Database: $LOCAL_DB
   Username: $LOCAL_USER
   Password: [tu contraseña local de PostgreSQL]

2. PASOS EN pgAdmin4:
   -----------------
   a) Abre pgAdmin4
   b) Click derecho en "Servers" -> "Register" -> "Server..."
   c) En la pestaña "General":
      - Name: LaburAR Local Development
   d) En la pestaña "Connection":
      - Host name/address: $LOCAL_HOST
      - Port: $LOCAL_PORT
      - Maintenance database: postgres (primero)
      - Username: $LOCAL_USER
      - Password: [tu contraseña]
      - Save password: SI (recomendado)
   e) Click en "Save"

3. CREAR BASE DE DATOS (si no existe):
   ----------------------------------
   Una vez conectado a PostgreSQL local:
   
   a) Click derecho en "Databases" -> "Create" -> "Database..."
   b) Database name: $LOCAL_DB
   c) Owner: $LOCAL_USER
   d) Click "Save"
   
   O usando SQL:
   CREATE DATABASE $LOCAL_DB
   WITH OWNER = $LOCAL_USER
   ENCODING = 'UTF8';

4. VERIFICAR CONEXIÓN:
   ------------------
   Query para probar:
   SELECT version();
   SELECT current_database();

5. CONFIGURACIONES COMUNES:
   ------------------------
   Si tienes problemas de conexión:
   
   a) XAMPP PostgreSQL:
      - Usuario: postgres
      - Contraseña: (vacía o la que configuraste)
      - Puerto: 5432
   
   b) Instalación independiente:
      - Usuario: postgres
      - Contraseña: la que configuraste al instalar
      - Puerto: 5432 (default)
   
   c) Verificar archivo pg_hba.conf si hay problemas de autenticación
"@

$CONFIG_FILE = "pgadmin-local-config.txt"
$configContent | Out-File -FilePath $CONFIG_FILE -Encoding UTF8

Write-Host "✅ Configuración guardada en: $CONFIG_FILE" -ForegroundColor Green
Write-Host ""

# Crear script de verificación de conexión
$testScript = @"
# Test de conexión PostgreSQL local
Write-Host "Probando conexión local..." -ForegroundColor Yellow
try {
    # Intentar conexión sin contraseña (XAMPP default)
    psql -h $LOCAL_HOST -U $LOCAL_USER -d postgres -p $LOCAL_PORT -c "SELECT version();"
} catch {
    Write-Host "Conexión sin contraseña falló. Intenta con contraseña." -ForegroundColor Yellow
}
"@

$testScript | Out-File -FilePath "test-local-connection.ps1" -Encoding UTF8

Write-Host "Scripts creados:" -ForegroundColor Cyan
Write-Host "- $CONFIG_FILE (configuración detallada)"
Write-Host "- test-local-connection.ps1 (prueba de conexión)"
Write-Host ""
Write-Host "🚀 Próximo paso: Configura la conexión en pgAdmin4 usando la info del archivo $CONFIG_FILE" -ForegroundColor Yellow

# Abrir archivo de configuración
Start-Process notepad.exe $CONFIG_FILE