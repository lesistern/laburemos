@echo off
echo ============================================
echo    LABURAR - REPARAR FRONTEND WINDOWS
echo ============================================
echo.

cd /d "C:\xampp\htdocs\Laburar\frontend"

echo [INFO] Limpiando cache y node_modules...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
if exist ".next" rmdir /s /q .next

echo [INFO] Instalando dependencias...
npm install

echo [INFO] Instalando dependencias adicionales necesarias...
npm install tailwindcss-animate @radix-ui/react-dropdown-menu @radix-ui/react-dialog

echo [INFO] Actualizando Next.js a version segura...
npm install next@latest

echo [INFO] Verificando instalacion...
npm audit

echo.
echo ============================================
echo         FRONTEND REPARADO EXITOSAMENTE
echo ============================================
echo.
echo Ahora puedes ejecutar:
echo npm run dev
echo.
echo O usar: start-windows.bat
echo.
pause