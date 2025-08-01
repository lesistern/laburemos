@echo off
echo ============================================
echo    LABURAR - MIGRACION A BASE DE DATOS CLOUD
echo ============================================
echo.

REM Backup local database
echo [1/4] Creando backup de base de datos local...
C:\xampp\mysql\bin\mysqldump -u root laburar_db > laburar_backup.sql
echo ✓ Backup creado: laburar_backup.sql

REM Check if cloud env exists
if not exist "backend\.env.cloud" (
    echo.
    echo [ERROR] No se encontro backend\.env.cloud
    echo Por favor:
    echo 1. Copia backend\.env.cloud.example a backend\.env.cloud
    echo 2. Actualiza las credenciales de tu base de datos cloud
    echo.
    pause
    exit /b 1
)

echo.
echo [2/4] Instalando herramientas de migracion...
cd backend
call npm install -g prisma @planetscale/cli

echo.
echo [3/4] Generando esquema Prisma desde MySQL local...
call npx prisma db pull

echo.
echo [4/4] Subiendo esquema a base de datos cloud...
REM Backup current .env
copy .env .env.local.backup >nul

REM Use cloud env
copy .env.cloud .env >nul

REM Push schema to cloud
call npx prisma db push

REM Restore local env
copy .env.local.backup .env >nul
del .env.local.backup

echo.
echo ============================================
echo    MIGRACION COMPLETADA
echo ============================================
echo.
echo ✓ Backup local guardado en: laburar_backup.sql
echo ✓ Esquema migrado a la nube
echo.
echo Siguientes pasos:
echo 1. Importa los datos en tu panel de PlanetScale/Supabase
echo 2. Actualiza backend\.env con las credenciales cloud
echo 3. Reinicia el backend: npm run start:dev
echo.
pause