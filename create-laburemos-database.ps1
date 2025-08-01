# Script para crear la base de datos laburemos en AWS RDS
Write-Host "=== Creando base de datos 'laburemos' en AWS RDS ===" -ForegroundColor Cyan
Write-Host ""

$RDS_ENDPOINT = "laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
$DB_USERNAME = "postgres"
$DB_PASSWORD = $env:AWS_RDS_PASSWORD
$DB_PORT = "5432"

Write-Host "Conectando a RDS para crear la base de datos..." -ForegroundColor Yellow
Write-Host ""

# Crear archivo SQL temporal
$sqlFile = "create-db.sql"
@"
-- Verificar si la base de datos existe
SELECT 'Base de datos existente:' as info, datname 
FROM pg_database 
WHERE datname = 'laburemos';

-- Crear la base de datos si no existe
CREATE DATABASE laburemos
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Verificar que se creó
SELECT 'Bases de datos disponibles:' as info;
SELECT datname FROM pg_database ORDER BY datname;
"@ | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "Necesitas psql instalado para ejecutar este script." -ForegroundColor Yellow
Write-Host "Si no lo tienes, usa pgAdmin4 con estos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Conectate a pgAdmin4 usando:" -ForegroundColor Cyan
Write-Host "   - Host: $RDS_ENDPOINT"
Write-Host "   - Port: $DB_PORT"
Write-Host "   - Maintenance database: postgres" -ForegroundColor Green
Write-Host "   - Username: $DB_USERNAME"
Write-Host "   - Password: [from environment variable AWS_RDS_PASSWORD]"
Write-Host ""
Write-Host "2. Una vez conectado, ejecuta:" -ForegroundColor Cyan
Write-Host "   CREATE DATABASE laburemos;" -ForegroundColor Green
Write-Host ""
Write-Host "3. Luego ya puedes conectarte a la base de datos 'laburemos'" -ForegroundColor Cyan

# Si tiene psql instalado
Write-Host ""
Write-Host "Si tienes psql instalado, ejecuta:" -ForegroundColor Yellow
Write-Host "psql -h $RDS_ENDPOINT -U $DB_USERNAME -d postgres -p $DB_PORT -f $sqlFile" -ForegroundColor Green