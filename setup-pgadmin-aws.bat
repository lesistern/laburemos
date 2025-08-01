@echo off
REM Script para configurar pgAdmin4 con AWS RDS PostgreSQL (Version Windows)
REM LABUREMOS - Setup pgAdmin4 para AWS RDS

echo === Configuracion de pgAdmin4 para AWS RDS - LABUREMOS ===
echo.

REM Informacion de conexion
set DB_INSTANCE=laburemos-db
set DB_USERNAME=postgres
set DB_PASSWORD=Laburemos2025!
set DB_NAME=laburemos
set DB_PORT=5432
set AWS_REGION=us-east-1
set RDS_ENDPOINT=laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com

echo Informacion de la base de datos RDS:
echo ==================================
echo Instance: %DB_INSTANCE%
echo Username: %DB_USERNAME%
echo Database: %DB_NAME%
echo Port: %DB_PORT%
echo Region: %AWS_REGION%
echo Endpoint: %RDS_ENDPOINT%
echo.

REM Crear archivo de configuracion para pgAdmin
set CONFIG_FILE=pgadmin-aws-config.txt
echo Creando archivo de configuracion: %CONFIG_FILE%

(
echo === Configuracion para pgAdmin4 - LABUREMOS AWS RDS ===
echo.
echo 1. INFORMACION DE CONEXION:
echo    ------------------------
echo    Name: LaburAR AWS Production
echo    Host: %RDS_ENDPOINT%
echo    Port: %DB_PORT%
echo    Database: %DB_NAME%
echo    Username: %DB_USERNAME%
echo    Password: %DB_PASSWORD%
echo.
echo 2. PASOS EN pgAdmin4:
echo    -----------------
echo    a^) Abre pgAdmin4
echo    b^) Click derecho en "Servers" -^> "Register" -^> "Server..."
echo    c^) En la pestana "General":
echo       - Name: LaburAR AWS Production
echo    d^) En la pestana "Connection":
echo       - Host name/address: %RDS_ENDPOINT%
echo       - Port: %DB_PORT%
echo       - Maintenance database: %DB_NAME%
echo       - Username: %DB_USERNAME%
echo       - Password: %DB_PASSWORD%
echo       - Save password: SI ^(opcional^)
echo    e^) Click en "Save"
echo.
echo 3. SOLUCION DE PROBLEMAS:
echo    ---------------------
echo    Si no puedes conectarte:
echo.   
echo    a^) Verifica el Security Group en AWS:
echo       - Ve a EC2 -^> Security Groups
echo       - Busca el security group de RDS
echo       - Asegurate que tenga una regla:
echo         Type: PostgreSQL
echo         Port: 5432
echo         Source: Tu IP o 0.0.0.0/0
echo.   
echo    b^) Verifica que RDS sea publicly accessible:
echo       - En RDS -^> Instances -^> laburemos-db
echo       - Publicly accessible: Yes
echo.   
echo    c^) Prueba la conexion con psql:
echo       psql -h %RDS_ENDPOINT% -U %DB_USERNAME% -d %DB_NAME% -p %DB_PORT%
) > %CONFIG_FILE%

echo.
echo Archivo de configuracion creado: %CONFIG_FILE%
echo.

REM Crear script PowerShell para obtener IP
echo Creando script para obtener tu IP...
(
echo $myip = ^(Invoke-WebRequest -Uri "https://api.ipify.org"^).Content
echo Write-Host "Tu IP actual es: $myip"
echo Write-Host ""
echo Write-Host "Para permitir tu IP en AWS Security Group:"
echo Write-Host "1. Ve a https://console.aws.amazon.com/ec2/"
echo Write-Host "2. Security Groups -^> Busca el de RDS"
echo Write-Host "3. Edit inbound rules -^> Add rule:"
echo Write-Host "   - Type: PostgreSQL"
echo Write-Host "   - Port: 5432"
echo Write-Host "   - Source: $myip/32"
echo Write-Host "   - Description: pgAdmin desde mi PC"
) > get-my-ip.ps1

echo.
echo === RESUMEN ===
echo 1. Configuracion guardada en: %CONFIG_FILE%
echo 2. Endpoint RDS: %RDS_ENDPOINT%
echo 3. Para ver tu IP actual, ejecuta: powershell -ExecutionPolicy Bypass .\get-my-ip.ps1
echo.
echo Ahora puedes abrir pgAdmin4 y usar la informacion en %CONFIG_FILE%
echo.
echo IMPORTANTE: Asegurate de que tu IP este permitida en el Security Group de RDS
echo.
pause