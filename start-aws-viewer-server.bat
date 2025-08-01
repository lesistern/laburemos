@echo off
echo ============================================
echo    AWS LABUREMOS VIEWER SERVER
echo ============================================
echo.

REM Cambiar al directorio correcto
cd /d C:\laburemos

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado
    pause
    exit /b 1
)

REM Verificar archivos necesarios
if not exist "aws-viewer-server.js" (
    echo [ERROR] No se encontro aws-viewer-server.js
    pause
    exit /b 1
)

if not exist "aws-viewer.html" (
    echo [ERROR] No se encontro aws-viewer.html
    pause
    exit /b 1
)

echo [INFO] Iniciando servidor AWS Viewer...
echo.
echo URLs disponibles:
echo - Servidor local: http://localhost:8080
echo - API Status: http://localhost:8080/api/status
echo.
echo [INFO] Funcionalidades:
echo - Visor web completo de AWS services
echo - API REST para estado de servicios  
echo - Compatible con Cursor + Claude CLI
echo - CORS habilitado para desarrollo
echo.

REM Iniciar servidor Node.js
node aws-viewer-server.js