@echo off
echo ============================================
echo    AWS LABUREMOS VIEWER - INICIALIZANDO
echo ============================================
echo.

REM Cambiar al directorio correcto
cd /d C:\laburemos

REM Verificar que existe el archivo HTML
if not exist "aws-viewer.html" (
    echo [ERROR] No se encontro aws-viewer.html
    pause
    exit /b 1
)

echo [INFO] Abriendo AWS Viewer en el navegador...
echo.
echo URLs disponibles:
echo - Produccion: https://laburemos.com.ar
echo - CloudFront: https://d2ijlktcsmmfsd.cloudfront.net  
echo - Backend API: http://3.81.56.168:3001
echo - NestJS API: http://3.81.56.168:3002
echo.

REM Abrir en el navegador predeterminado
start "" "aws-viewer.html"

echo [INFO] AWS Viewer iniciado correctamente
echo.
echo Funcionalidades:
echo - Visor integrado de todas las URLs de AWS
echo - Acceso rapido a servicios de AWS Console
echo - Monitor de estado en tiempo real
echo - Compatible con Cursor + Claude CLI
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul