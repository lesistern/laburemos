@echo off
echo ============================================
echo    LABURAR - SETUP INICIAL WINDOWS
echo ============================================
echo.

REM Verificar Docker Desktop
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Docker no esta instalado. 
    echo Puedes usar XAMPP para MySQL o instalar Docker Desktop.
    echo Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop/
    echo.
)

REM Crear directorios necesarios
echo [INFO] Creando estructura de directorios...
if not exist "logs" mkdir logs
if not exist "storage" mkdir storage
if not exist "uploads" mkdir uploads
if not exist "backups" mkdir backups

REM Configurar permisos (Windows)
echo [INFO] Configurando permisos de directorios...
icacls logs /grant Everyone:(OI)(CI)F >nul
icacls storage /grant Everyone:(OI)(CI)F >nul
icacls uploads /grant Everyone:(OI)(CI)F >nul

REM Copiar archivos de configuración
echo [INFO] Configurando archivos de entorno...
if not exist "frontend\.env.local" (
    copy "frontend\.env.example" "frontend\.env.local" >nul
    echo Frontend .env.local creado
)

if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo Backend .env creado
)

REM Configurar base de datos
echo [INFO] ¿Quieres usar Docker para PostgreSQL? (Y/N)
set /p USE_DOCKER=
if /i "%USE_DOCKER%"=="Y" (
    echo [INFO] Iniciando contenedores Docker...
    docker-compose -f docker-compose.windows.yml up -d
    echo [INFO] PostgreSQL disponible en localhost:5432
    echo [INFO] Adminer disponible en http://localhost:8080
    echo [INFO] Redis disponible en localhost:6379
) else (
    echo [INFO] Usando XAMPP MySQL existente...
    echo [INFO] Importa el esquema desde: database\create_laburar_db.sql
    echo [INFO] Accede a phpMyAdmin: http://localhost/phpmyadmin
)

echo.
echo ============================================
echo           SETUP COMPLETADO
echo ============================================
echo.
echo Proximos pasos:
echo 1. Ejecuta: start-windows.bat
echo 2. Abre: http://localhost:3000 (Frontend)
echo 3. Abre: http://localhost:3001/docs (Backend API)
echo.
echo ¡LaburAR configurado correctamente en Windows!
pause