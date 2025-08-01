@echo off
echo =========================================
echo  CREAR BASE DE DATOS - VERSION SIMPLE
echo =========================================

REM Verificar si existe el archivo SQL completo
if not exist "database\create_laburemos_db_complete.sql" (
    echo ERROR: No se encontro el archivo database\create_laburemos_db_complete.sql
    echo.
    echo Verifica que el archivo exista en la carpeta database\
    pause
    exit /b 1
)

echo Archivo SQL encontrado: database\create_laburemos_db_complete.sql
echo.

REM Intentar con mysql directamente (si esta en PATH)
echo Intentando con mysql en PATH del sistema...
mysql -u root < database\create_laburemos_db_complete.sql 2>nul

if not errorlevel 1 (
    echo.
    echo BASE DE DATOS CREADA CORRECTAMENTE
    echo Usuario: laburemos_user
    echo Contrasena: Tyr1945@
    echo Base de datos: laburemos_db
    echo.
    goto :success
)

REM Intentar con rutas comunes de XAMPP
echo.
echo Intentando con XAMPP en C:\xampp...
if exist "C:\xampp\mysql\bin\mysql.exe" (
    "C:\xampp\mysql\bin\mysql.exe" -u root < database\create_laburemos_db_complete.sql 2>nul
    if not errorlevel 1 (
        echo BASE DE DATOS CREADA CORRECTAMENTE
        echo Usuario: laburemos_user  
        echo Contrasena: Tyr1945@
        echo Base de datos: laburemos_db
        goto :success
    )
)

echo.
echo Intentando con XAMPP en Program Files...
if exist "C:\Program Files\xampp\mysql\bin\mysql.exe" (
    "C:\Program Files\xampp\mysql\bin\mysql.exe" -u root < database\create_laburemos_db_complete.sql 2>nul
    if not errorlevel 1 (
        echo BASE DE DATOS CREADA CORRECTAMENTE
        echo Usuario: laburemos_user
        echo Contrasena: Tyr1945@
        echo Base de datos: laburemos_db
        goto :success
    )
)

REM Si llega aqui, no funciono automaticamente
echo.
echo =========================================
echo  CREACION MANUAL REQUERIDA
echo =========================================
echo.
echo El script automatico no funciono. Sigue estos pasos:
echo.
echo OPCION 1 - phpMyAdmin (Recomendado):
echo 1. Abre http://localhost/phpmyadmin
echo 2. Clic en "Importar"
echo 3. Selecciona: database\create_laburemos_db_complete.sql
echo 4. Clic en "Continuar"
echo.
echo OPCION 2 - Linea de comandos:
echo 1. Abre CMD como administrador
echo 2. Navega a: %CD%
echo 3. Ejecuta: mysql -u root -p < database\create_laburemos_db_complete.sql
echo 4. Presiona Enter (contrasena vacia)
echo.
echo CREDENCIALES RESULTANTES:
echo Usuario: laburemos_user
echo Contrasena: Tyr1945@
echo Base de datos: laburemos_db
echo.
pause
exit /b 1

:success
echo.
echo =========================================
echo  PROCESO COMPLETADO EXITOSAMENTE
echo =========================================
echo.
echo Para conectarte:
echo - phpMyAdmin: http://localhost/phpmyadmin
echo - Usuario: laburemos_user
echo - Contrasena: Tyr1945@
echo.
pause