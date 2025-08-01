@echo off
echo ============================================
echo    LABUREMOS - PATH UPDATE VERIFICATION
echo ============================================
echo.

cd /d C:\laburemos

echo [INFO] Verificando rutas actualizadas...
echo.

echo 1. Verificando start-windows.bat...
findstr /c:"C:\laburemos" start-windows.bat >nul
if %errorlevel% equ 0 (
    echo ✅ start-windows.bat - Rutas actualizadas correctamente
) else (
    echo ❌ start-windows.bat - Rutas NO actualizadas
)

echo 2. Verificando start-aws-viewer-server.bat...
findstr /c:"C:\laburemos" start-aws-viewer-server.bat >nul
if %errorlevel% equ 0 (
    echo ✅ start-aws-viewer-server.bat - Rutas actualizadas correctamente
) else (
    echo ❌ start-aws-viewer-server.bat - Rutas NO actualizadas
)

echo 3. Verificando start-aws-viewer.bat...
findstr /c:"C:\laburemos" start-aws-viewer.bat >nul
if %errorlevel% equ 0 (
    echo ✅ start-aws-viewer.bat - Rutas actualizadas correctamente
) else (
    echo ❌ start-aws-viewer.bat - Rutas NO actualizadas
)

echo 4. Verificando scripts/start-local-development.bat...
findstr /c:"C:\laburemos" scripts\start-local-development.bat >nul
if %errorlevel% equ 0 (
    echo ✅ scripts/start-local-development.bat - Rutas actualizadas correctamente
) else (
    echo ❌ scripts/start-local-development.bat - Rutas NO actualizadas
)

echo 5. Verificando CLAUDE.md...
findstr /c:"C:\laburemos" CLAUDE.md >nul
if %errorlevel% equ 0 (
    echo ✅ CLAUDE.md - Rutas actualizadas correctamente
) else (
    echo ❌ CLAUDE.md - Rutas NO actualizadas
)

echo 6. Verificando GUIA-PGADMIN-AWS-COMPLETA.md...
findstr /c:"C:\laburemos" GUIA-PGADMIN-AWS-COMPLETA.md >nul
if %errorlevel% equ 0 (
    echo ✅ GUIA-PGADMIN-AWS-COMPLETA.md - Rutas actualizadas correctamente
) else (
    echo ❌ GUIA-PGADMIN-AWS-COMPLETA.md - Rutas NO actualizadas
)

echo.
echo 7. Verificando estructura de directorios...
if exist "frontend" (
    echo ✅ Directorio frontend existe
) else (
    echo ❌ Directorio frontend NO encontrado
)

if exist "backend" (
    echo ✅ Directorio backend existe
) else (
    echo ❌ Directorio backend NO encontrado
)

if exist "scripts" (
    echo ✅ Directorio scripts existe
) else (
    echo ❌ Directorio scripts NO encontrado
)

echo.
echo 8. Verificando que rutas antiguas NO existan...
findstr /c:"D:\Laburar" start-windows.bat >nul 2>&1
if %errorlevel% neq 0 (
    echo ✅ start-windows.bat - Sin rutas antiguas
) else (
    echo ❌ start-windows.bat - Aún contiene rutas antiguas
)

findstr /c:"D:\Laburar" CLAUDE.md >nul 2>&1
if %errorlevel% neq 0 (
    echo ✅ CLAUDE.md - Sin rutas antiguas
) else (
    echo ❌ CLAUDE.md - Aún contiene rutas antiguas
)

echo.
echo ============================================
echo     VERIFICACIÓN COMPLETADA
echo ============================================
echo.
echo Próximos pasos:
echo 1. Probar scripts: .\start-windows.bat
echo 2. Verificar desarrollo: .\scripts\start-local-development.bat
echo 3. Probar AWS viewer: .\start-aws-viewer-server.bat
echo.
pause