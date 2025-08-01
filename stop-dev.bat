@echo off
echo.
echo ========================================
echo  🛑 LABUREMOS - Detener Desarrollo
echo ========================================
echo.

echo 🔍 Buscando procesos Node.js en puertos 3000 y 3001...

REM Buscar y terminar procesos en puerto 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    if not "%%a"=="0" (
        echo 🌐 Deteniendo Frontend (Puerto 3000) - PID: %%a
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Buscar y terminar procesos en puerto 3001 (Backend)
for /f "tokens=5" %%b in ('netstat -aon ^| findstr :3001') do (
    if not "%%b"=="0" (
        echo 🔧 Deteniendo Backend (Puerto 3001) - PID: %%b
        taskkill /F /PID %%b >nul 2>&1
    )
)

REM Terminar ventanas con títulos específicos
taskkill /F /FI "WINDOWTITLE:LABUREMOS Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE:LABUREMOS Frontend*" >nul 2>&1

echo.
echo ✅ Procesos de desarrollo detenidos
echo.
echo 📊 Puertos liberados:
echo    🌐 Puerto 3000 (Frontend)
echo    🔧 Puerto 3001 (Backend)
echo.

pause