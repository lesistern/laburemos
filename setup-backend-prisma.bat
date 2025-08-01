@echo off
REM Script para configurar Prisma con PostgreSQL local
REM LABUREMOS - Setup inicial de base de datos

title LABUREMOS - Setup Prisma PostgreSQL
color 0B

echo ========================================
echo   LABUREMOS - Setup Prisma Local
echo ========================================
echo.

REM Cambiar al directorio del backend
cd /d "D:\Laburar\backend"

echo [INFO] Directorio actual: %CD%
echo.

REM Verificar prerequisites
if not exist "package.json" (
    echo [ERROR] No se encontro package.json
    pause
    exit /b 1
)

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo [ERROR] Error instalando dependencias
        pause
        exit /b 1
    )
    echo.
)

REM Verificar configuracion de Prisma
echo [INFO] Verificando configuracion de Prisma...
if not exist "prisma\schema.prisma" (
    echo [ERROR] No se encontro schema.prisma
    echo [INFO] Inicializando Prisma...
    npx prisma init
    echo.
)

REM Mostrar configuracion actual
echo ========================================
echo   CONFIGURACION POSTGRESQL LOCAL
echo ========================================
echo Host: localhost
echo Port: 5432
echo Database: laburemos
echo User: postgres
echo ========================================
echo.

REM Generar cliente de Prisma
echo [INFO] Generando cliente de Prisma...
npx prisma generate
if errorlevel 1 (
    echo [ERROR] Error generando cliente
    pause
    exit /b 1
)
echo.

REM Aplicar schema a la base de datos
echo [INFO] Aplicando schema a PostgreSQL local...
echo [INFO] Esto creara las tablas en tu base de datos 'laburemos'
echo.
npx prisma db push
if errorlevel 1 (
    echo [ERROR] Error aplicando schema
    echo.
    echo VERIFICACIONES:
    echo 1. PostgreSQL esta corriendo?
    echo 2. Base de datos 'laburemos' existe?
    echo 3. Usuario 'postgres' tiene permisos?
    echo 4. Archivo .env configurado correctamente?
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Schema aplicado exitosamente!
echo.

REM Abrir Prisma Studio (opcional)
echo ========================================
echo   HERRAMIENTAS DISPONIBLES
echo ========================================
echo.
set /p openStudio="Quieres abrir Prisma Studio? (y/n): "
if /i "%openStudio%"=="y" (
    echo [INFO] Abriendo Prisma Studio...
    echo [INFO] Se abrira en: http://localhost:5555
    start npx prisma studio
    echo.
)

REM Verificar migraciones
echo [INFO] Estado de la base de datos:
npx prisma db seed 2>nul || echo [INFO] No hay seeders configurados
echo.

echo ========================================
echo   SETUP COMPLETADO
echo ========================================
echo.
echo Proximos pasos:
echo 1. Ejecuta: start-backend-local.bat
echo 2. Ve a: http://localhost:3001/docs
echo 3. Usa pgAdmin4 para ver las tablas creadas
echo.
echo La base de datos local esta lista para desarrollo!
echo.
pause