@echo off
echo =========================================
echo  VERIFICAR BASE DE DATOS LABUREMOS_DB
echo =========================================

REM Buscar mysql
set MYSQL_PATH=
if exist "C:\xampp\mysql\bin\mysql.exe" set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
if exist "C:\Program Files\xampp\mysql\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\xampp\mysql\bin\mysql.exe

REM Verificar con el usuario laburemos_user
echo Verificando conexion con usuario laburemos_user...
echo.

if not "%MYSQL_PATH%"=="" (
    REM Intentar conectar con el usuario creado
    "%MYSQL_PATH%" -u laburemos_user -pTyr1945@ -e "USE laburemos_db; SHOW TABLES;" 2>nul
    if not errorlevel 1 (
        echo EXITO: Base de datos y usuario funcionando correctamente
        echo.
        echo Contando tablas...
        "%MYSQL_PATH%" -u laburemos_user -pTyr1945@ -e "USE laburemos_db; SELECT COUNT(*) as 'Total Tablas' FROM information_schema.tables WHERE table_schema = 'laburemos_db';" 2>nul
        echo.
        echo Verificando usuario admin...
        "%MYSQL_PATH%" -u laburemos_user -pTyr1945@ -e "USE laburemos_db; SELECT email, user_type FROM users WHERE user_type = 'admin' LIMIT 1;" 2>nul
        echo.
        echo Base de datos configurada correctamente!
    ) else (
        echo ERROR: No se puede conectar con usuario laburemos_user
        echo.
        echo Verificando si la base de datos existe...
        "%MYSQL_PATH%" -u root -e "SHOW DATABASES LIKE 'laburemos_db';" 2>nul
        if not errorlevel 1 (
            echo La base de datos 'laburemos_db' existe pero el usuario no funciona
        ) else (
            echo La base de datos 'laburemos_db' no existe
        )
    )
) else (
    echo No se encontro MySQL/XAMPP
    echo Verifica manualmente en phpMyAdmin: http://localhost/phpmyadmin
)

echo.
echo =========================================
echo  VERIFICACION COMPLETADA
echo =========================================
pause