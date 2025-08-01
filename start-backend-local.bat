@echo off
REM Script para iniciar el backend local de LABUREMOS
REM Configurado para PostgreSQL local

title LABUREMOS - Backend Local
color 0A

echo ========================================
echo   LABUREMOS - Backend Local Startup
echo ========================================
echo.

REM Cambiar al directorio del backend
cd /d "D:\Laburar\backend"

echo [INFO] Directorio actual: %CD%
echo.

REM Verificar si existe package.json
if not exist "package.json" (
    echo [ERROR] No se encontro package.json en el directorio backend
    echo [ERROR] Verifica que estas en el directorio correcto
    pause
    exit /b 1
)

REM Verificar si existe .env
if not exist ".env" (
    echo [WARNING] No se encontro archivo .env
    echo [INFO] El backend usara configuracion por defecto
    echo.
)

REM Verificar si node_modules existe
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    echo.
    npm install
    if errorlevel 1 (
        echo [ERROR] Error al instalar dependencias
        pause
        exit /b 1
    )
    echo.
)

REM Generar cliente de Prisma
echo [INFO] Generando cliente de Prisma...
npx prisma generate
if errorlevel 1 (
    echo [ERROR] Error al generar cliente de Prisma
    pause
    exit /b 1
)
echo.

REM Aplicar migraciones/schema a la base de datos
echo [INFO] Aplicando schema a la base de datos local...
npx prisma db push
if errorlevel 1 (
    echo [WARNING] Error al aplicar schema. Continuando...
    echo [WARNING] Puede que necesites configurar la base de datos
    echo.
)

REM Mostrar configuracion
echo ========================================
echo   CONFIGURACION ACTUAL
echo ========================================
echo Database: PostgreSQL Local
echo Host: localhost:5432
echo Database: laburemos
echo Backend URL: http://localhost:3001
echo API Docs: http://localhost:3001/docs
echo ========================================
echo.

REM Iniciar el servidor de desarrollo
echo [INFO] Iniciando servidor de desarrollo...
echo [INFO] Presiona Ctrl+C para detener el servidor
echo.

npm run start:dev

REM Si el comando falla, mostrar ayuda
if errorlevel 1 (
    echo.
    echo [ERROR] Error al iniciar el servidor
    echo.
    echo POSIBLES SOLUCIONES:
    echo 1. Verifica que PostgreSQL este corriendo
    echo 2. Verifica la configuracion en .env
    echo 3. Ejecuta: npm install
    echo 4. Ejecuta: npx prisma generate
    echo.
    pause
)

echo.
echo [INFO] Servidor detenido
pause