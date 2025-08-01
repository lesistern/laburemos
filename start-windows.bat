@echo off
echo ============================================
echo    LABURAR - INICIO AUTOMATICO WINDOWS
echo ============================================
echo.

REM Verificar si Node.js esta instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado. Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar XAMPP
if not exist "C:\xampp\xampp-control.exe" (
    echo [ERROR] XAMPP no encontrado en C:\xampp\
    echo Por favor instala XAMPP desde: https://www.apachefriends.org/
    pause
    exit /b 1
)

echo [INFO] Iniciando servicios XAMPP...
start "" "C:\xampp\xampp-control.exe"
timeout /t 3 /nobreak >nul

REM Frontend Next.js
echo [INFO] Configurando Frontend (Next.js)...
if not exist "frontend\node_modules" (
    echo [INFO] Instalando dependencias del frontend...
    cd frontend
    call npm install
    cd ..
)

REM Backend NestJS  
echo [INFO] Configurando Backend (NestJS)...
if not exist "backend\node_modules" (
    echo [INFO] Instalando dependencias del backend...
    cd backend
    call npm install
    cd ..
)

echo.
echo ============================================
echo    SERVICIOS CONFIGURADOS CORRECTAMENTE
echo ============================================
echo.
echo Urls disponibles:
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:3001
echo - MySQL:    http://localhost/phpmyadmin
echo.
echo [INFO] Verificando dependencias del frontend...
cd frontend
if not exist "node_modules\tailwindcss-animate" (
    echo [INFO] Instalando dependencias faltantes...
    call npm install tailwindcss-animate next-themes @radix-ui/react-dropdown-menu @radix-ui/react-dialog
)
cd ..

echo [INFO] Iniciando Frontend en nueva ventana...
start "LaburAR Frontend" cmd /k "cd /d D:\Laburar\frontend && npm run dev"

timeout /t 2 /nobreak >nul

echo [INFO] Iniciando Backend en nueva ventana...
start "LaburAR Backend" cmd /k "cd /d D:\Laburar\backend && npm run start:dev"

echo.
echo ¡LaburAR iniciado correctamente en Windows!
echo Presiona cualquier tecla para cerrar...
pause >nul