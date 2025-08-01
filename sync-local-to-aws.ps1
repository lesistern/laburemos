# Script para sincronizar base de datos local con AWS RDS
# LABUREMOS - Sincronización de datos

Write-Host "=== Sincronización de Base de Datos Local → AWS RDS ===" -ForegroundColor Cyan
Write-Host ""

# Configuración
$LOCAL_DB = "laburemos"
$LOCAL_USER = "postgres"
$LOCAL_HOST = "localhost"
$LOCAL_PORT = "5432"

$AWS_HOST = "laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
$AWS_USER = "postgres"
$AWS_DB = "laburemos"
$AWS_PORT = "5432"
$AWS_PASSWORD = $env:AWS_RDS_PASSWORD

# Opciones de sincronización
Write-Host "Selecciona qué quieres hacer:" -ForegroundColor Yellow
Write-Host "1. Exportar estructura y datos desde local a AWS"
Write-Host "2. Solo exportar estructura (sin datos)"
Write-Host "3. Hacer backup de AWS antes de sincronizar"
Write-Host "4. Ver estado actual de ambas bases de datos"
Write-Host ""
$opcion = Read-Host "Ingresa el número de opción"

switch ($opcion) {
    "1" {
        Write-Host ""
        Write-Host "Exportando base de datos local..." -ForegroundColor Yellow
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "laburemos_local_backup_$timestamp.sql"
        
        Write-Host "Necesitarás ingresar la contraseña de tu PostgreSQL local" -ForegroundColor Cyan
        $cmd = "pg_dump -h $LOCAL_HOST -U $LOCAL_USER -d $LOCAL_DB -p $LOCAL_PORT -f $backupFile"
        Write-Host "Ejecutando: $cmd" -ForegroundColor Gray
        
        # Comando para importar en AWS
        Write-Host ""
        Write-Host "Una vez creado el backup, importa en AWS con:" -ForegroundColor Yellow
        Write-Host "psql -h $AWS_HOST -U $AWS_USER -d $AWS_DB -p $AWS_PORT -f $backupFile" -ForegroundColor Green
        Write-Host ""
        Write-Host "O usa pgAdmin4:" -ForegroundColor Yellow
        Write-Host "1. Click derecho en la base de datos 'laburemos' en AWS"
        Write-Host "2. Selecciona 'Restore...'"
        Write-Host "3. Selecciona el archivo: $backupFile"
    }
    
    "2" {
        Write-Host ""
        Write-Host "Exportando solo estructura..." -ForegroundColor Yellow
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "laburemos_structure_only_$timestamp.sql"
        
        $cmd = "pg_dump -h $LOCAL_HOST -U $LOCAL_USER -d $LOCAL_DB -p $LOCAL_PORT --schema-only -f $backupFile"
        Write-Host "Ejecutando: $cmd" -ForegroundColor Gray
    }
    
    "3" {
        Write-Host ""
        Write-Host "Haciendo backup de AWS RDS..." -ForegroundColor Yellow
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "laburemos_aws_backup_$timestamp.sql"
        
        $env:PGPASSWORD = $AWS_PASSWORD
        $cmd = "pg_dump -h $AWS_HOST -U $AWS_USER -d $AWS_DB -p $AWS_PORT -f $backupFile"
        Write-Host "Ejecutando: $cmd" -ForegroundColor Gray
    }
    
    "4" {
        Write-Host ""
        Write-Host "Estado de las bases de datos:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "LOCAL ($LOCAL_HOST):" -ForegroundColor Cyan
        Write-Host "- Host: $LOCAL_HOST"
        Write-Host "- Database: $LOCAL_DB"
        Write-Host "- User: $LOCAL_USER"
        Write-Host ""
        Write-Host "AWS RDS:" -ForegroundColor Cyan
        Write-Host "- Host: $AWS_HOST"
        Write-Host "- Database: $AWS_DB"
        Write-Host "- User: $AWS_USER"
        Write-Host ""
        Write-Host "Para ver las tablas en pgAdmin4:" -ForegroundColor Yellow
        Write-Host "1. Conecta a ambas bases de datos"
        Write-Host "2. Expande: Databases > laburemos > Schemas > public > Tables"
    }
}

Write-Host ""
Write-Host "Script SQL de exploración creado: explore-aws-database.sql" -ForegroundColor Green
Write-Host "Úsalo en pgAdmin4 para ver el estado de la base de datos" -ForegroundColor Green