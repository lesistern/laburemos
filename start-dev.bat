@echo off
echo.
echo ========================================
echo  🚀 LABUREMOS - Desarrollo Local
echo ========================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "frontend" (
    echo ❌ Error: No se encuentra el directorio 'frontend'
    echo    Ejecuta este script desde D:\Laburar
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ Error: No se encuentra el directorio 'backend'
    echo    Ejecuta este script desde D:\Laburar
    pause
    exit /b 1
)

echo 📋 Iniciando servicios de desarrollo...
echo.

REM Crear archivo de log temporal
set LOGFILE=%TEMP%\laburemos-dev.log

REM Iniciar Backend (NestJS) en nueva ventana
echo 🔧 Iniciando Backend (NestJS) en puerto 3001...
start "LABUREMOS Backend" cmd /k "cd /d %CD%\backend && echo 🔧 Backend iniciando... && npm run start:dev"

REM Esperar un poco antes de iniciar frontend
timeout /t 3 /nobreak >nul

REM Iniciar Frontend (Next.js) en nueva ventana
echo 🌐 Iniciando Frontend (Next.js) en puerto 3000...
start "LABUREMOS Frontend" cmd /k "cd /d %CD%\frontend && echo 🌐 Frontend iniciando... && npm run dev"

echo.
echo ✅ Servicios iniciándose...
echo.
echo 📊 URLs de acceso:
echo    🌐 Frontend:  http://localhost:3000
echo    🔧 Backend:   http://localhost:3001
echo    📚 API Docs:  http://localhost:3001/docs
echo    🎯 Admin:     http://localhost:3000/admin
echo.
echo ⚠️  IMPORTANTE:
echo    - Asegúrate de que XAMPP con MySQL esté corriendo
echo    - Para detener: Cierra las ventanas de Backend y Frontend
echo    - O presiona Ctrl+C en cada ventana
echo.

pause