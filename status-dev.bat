@echo off
echo.
echo ========================================
echo  📊 LABUREMOS - Estado de Desarrollo
echo ========================================
echo.

echo 🔍 Verificando servicios...
echo.

REM Verificar Frontend (Puerto 3000)
netstat -an | findstr :3000 >nul
if %errorlevel%==0 (
    echo 🌐 Frontend: ✅ CORRIENDO en puerto 3000
    echo    URL: http://localhost:3000
) else (
    echo 🌐 Frontend: ❌ NO está corriendo
)

REM Verificar Backend (Puerto 3001)
netstat -an | findstr :3001 >nul
if %errorlevel%==0 (
    echo 🔧 Backend:  ✅ CORRIENDO en puerto 3001
    echo    URL: http://localhost:3001
    echo    Docs: http://localhost:3001/docs
) else (
    echo 🔧 Backend:  ❌ NO está corriendo
)

echo.

REM Verificar MySQL (XAMPP)
netstat -an | findstr :3306 >nul
if %errorlevel%==0 (
    echo 🗄️  MySQL:    ✅ CORRIENDO en puerto 3306
) else (
    echo 🗄️  MySQL:    ❌ NO está corriendo
    echo    ⚠️  Inicia XAMPP con MySQL
)

echo.

REM Mostrar procesos Node.js
echo 🔍 Procesos Node.js activos:
tasklist | findstr node.exe

echo.
echo 💡 Comandos útiles:
echo    ▶️  Iniciar: start-dev.bat
echo    🛑 Detener: stop-dev.bat
echo    📊 Estado:  status-dev.bat
echo.

pause