@echo off
setlocal enabledelayedexpansion

echo =========================================
echo  CREANDO BASE DE DATOS LABUREMOS_DB
echo =========================================

REM Buscar XAMPP en ubicaciones comunes
set XAMPP_PATH=
if exist "C:\xampp\mysql\bin\mysql.exe" set XAMPP_PATH=C:\xampp\mysql\bin
if exist "C:\Program Files\xampp\mysql\bin\mysql.exe" set XAMPP_PATH=C:\Program Files\xampp\mysql\bin
if exist "D:\xampp\mysql\bin\mysql.exe" set XAMPP_PATH=D:\xampp\mysql\bin

if "!XAMPP_PATH!"=="" (
    echo ERROR: No se encontro XAMPP/MySQL
    echo.
    echo SOLUCION MANUAL:
    echo 1. Instala XAMPP desde: https://www.apachefriends.org/
    echo 2. O abre phpMyAdmin: http://localhost/phpmyadmin
    echo 3. Crea nueva base de datos: laburemos_db
    echo 4. Importa: database\create_laburemos_db_complete.sql
    echo.
    pause
    exit /b 1
)

echo MySQL encontrado en: !XAMPP_PATH!
echo.

REM Verificar si MySQL esta corriendo
echo Verificando si MySQL esta corriendo...
"!XAMPP_PATH!\mysql.exe" -u root -e "SELECT 1;" 2>nul
if errorlevel 1 (
    echo ERROR: MySQL no esta corriendo
    echo.
    echo SOLUCION:
    echo 1. Abre XAMPP Control Panel
    echo 2. Inicia el servicio MySQL
    echo 3. Ejecuta este script nuevamente
    echo.
    pause
    exit /b 1
)

echo MySQL esta corriendo correctamente
echo.

REM Crear la base de datos completa con usuario
echo Creando base de datos completa con usuario laburemos_user...

REM Verificar si existe el esquema completo
if exist "database\create_laburemos_db_complete.sql" (
    echo Ejecutando esquema completo con 35 tablas...
    echo.
    
    REM Ejecutar el script SQL completo
    "!XAMPP_PATH!\mysql.exe" -u root < database\create_laburemos_db_complete.sql
    
    if errorlevel 1 (
        echo ERROR: No se pudo ejecutar el esquema completo
        echo.
        echo SOLUCION MANUAL:
        echo 1. Abre una terminal como administrador
        echo 2. Navega a: !CD!
        echo 3. Ejecuta: "!XAMPP_PATH!\mysql.exe" -u root -p < database\create_laburemos_db_complete.sql
        echo 4. Ingresa la contrasena de root (usualmente vacia)
        echo.
        pause
        exit /b 1
    ) else (
        echo.
        echo ========================================
        echo  BASE DE DATOS CREADA CORRECTAMENTE
        echo ========================================
        echo.
        echo Usuario: laburemos_user
        echo Contrasena: Tyr1945@
        echo Base de datos: laburemos_db
        echo Tablas: 35 tablas con datos iniciales
        echo.
        echo Para conectarte:
        echo - phpMyAdmin: http://localhost/phpmyadmin
        echo - Usuario: laburemos_user
        echo - Contrasena: Tyr1945@
        echo.
    )
) else if exist "database\create_laburemos_db.sql" (
    echo Usando esquema basico...
    echo.
    
    REM Crear base de datos
    "!XAMPP_PATH!\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS laburemos_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    REM Importar esquema basico
    "!XAMPP_PATH!\mysql.exe" -u root laburemos_db < database\create_laburemos_db.sql
    
    if errorlevel 1 (
        echo Error importando esquema basico
    ) else (
        echo Esquema basico importado correctamente
    )
) else (
    echo No se encontro ningun archivo SQL de esquema
    echo Creando base de datos vacia...
    echo.
    
    "!XAMPP_PATH!\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS laburemos_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    if errorlevel 1 (
        echo Error creando base de datos
        echo.
        echo SOLUCION MANUAL:
        echo 1. Abre phpMyAdmin: http://localhost/phpmyadmin
        echo 2. Crea nueva base de datos: laburemos_db
        echo.
    ) else (
        echo Base de datos vacia creada correctamente
    )
)

echo.
echo =========================================
echo  PROCESO COMPLETADO
echo =========================================
echo.
echo Para probar la conexion:
echo 1. Abre phpMyAdmin: http://localhost/phpmyadmin
echo 2. Usuario: laburemos_user
echo 3. Contrasena: Tyr1945@
echo.
pause