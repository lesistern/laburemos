# Script completo para sincronización Local ↔ AWS
# LABUREMOS - Database Sync Workflow

Write-Host "=== LABUREMOS Database Sync Workflow ===" -ForegroundColor Cyan
Write-Host ""

# Configuración
$LOCAL_HOST = "localhost"
$LOCAL_PORT = "5432"
$LOCAL_USER = "postgres"
$LOCAL_DB = "laburemos"

$AWS_HOST = "laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
$AWS_PORT = "5432"
$AWS_USER = "postgres"
$AWS_DB = "laburemos"
$AWS_PASSWORD = "Laburemos2025!"

Write-Host "Configuración actual:" -ForegroundColor Yellow
Write-Host "LOCAL:  $LOCAL_HOST:$LOCAL_PORT/$LOCAL_DB"
Write-Host "AWS:    $AWS_HOST:$AWS_PORT/$AWS_DB"
Write-Host ""

Write-Host "Selecciona la operación:" -ForegroundColor Cyan
Write-Host "1. 🔍 Verificar estado de ambas bases de datos"
Write-Host "2. 📤 Sincronizar LOCAL → AWS (subir cambios a producción)"
Write-Host "3. 📥 Sincronizar AWS → LOCAL (traer datos de producción)"
Write-Host "4. 💾 Hacer backup de LOCAL"
Write-Host "5. 💾 Hacer backup de AWS"
Write-Host "6. 🔄 Reinicializar base de datos local (vacía)"
Write-Host ""

$opcion = Read-Host "Ingresa el número de opción"

switch ($opcion) {
    "1" {
        Write-Host ""
        Write-Host "=== VERIFICANDO ESTADO DE BASES DE DATOS ===" -ForegroundColor Yellow
        Write-Host ""
        
        Write-Host "📋 Instrucciones para verificar en pgAdmin4:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "PASO 1 - Base de datos LOCAL:" -ForegroundColor Green
        Write-Host "1. Conecta a tu servidor local en pgAdmin4"
        Write-Host "2. Selecciona la base de datos 'laburemos'"
        Write-Host "3. Ejecuta el archivo: check-local-database.sql"
        Write-Host ""
        Write-Host "PASO 2 - Base de datos AWS:" -ForegroundColor Green
        Write-Host "1. Conecta a tu servidor AWS en pgAdmin4"
        Write-Host "2. Selecciona la base de datos 'laburemos'"
        Write-Host "3. Ejecuta la misma consulta para comparar"
        Write-Host ""
        Write-Host "Consulta rápida para ejecutar en ambas:" -ForegroundColor Cyan
        Write-Host "SELECT COUNT(*) as total_tablas FROM pg_tables WHERE schemaname = 'public';"
    }
    
    "2" {
        Write-Host ""
        Write-Host "=== SINCRONIZAR LOCAL → AWS (Subir a producción) ===" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE: Esto sobrescribirá la base de datos de AWS" -ForegroundColor Red
        $confirm = Read-Host "¿Estás seguro? (escribe 'SI' para continuar)"
        
        if ($confirm -eq "SI") {
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $backupFile = "laburemos_local_to_aws_$timestamp.sql"
            
            Write-Host ""
            Write-Host "📋 INSTRUCCIONES para pgAdmin4:" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "PASO 1 - Hacer backup de LOCAL:" -ForegroundColor Green
            Write-Host "1. Click derecho en base de datos 'laburemos' (LOCAL)"
            Write-Host "2. Selecciona 'Backup...'"
            Write-Host "3. Filename: $backupFile"
            Write-Host "4. Format: Plain"
            Write-Host "5. Click 'Backup'"
            Write-Host ""
            Write-Host "PASO 2 - Hacer backup de AWS (recomendado):" -ForegroundColor Green
            Write-Host "1. Click derecho en base de datos 'laburemos' (AWS)"
            Write-Host "2. Selecciona 'Backup...'"
            Write-Host "3. Filename: aws_backup_before_sync_$timestamp.sql"
            Write-Host "4. Click 'Backup'"
            Write-Host ""
            Write-Host "PASO 3 - Limpiar AWS y restaurar:" -ForegroundColor Green
            Write-Host "1. Ejecuta en AWS: DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
            Write-Host "2. Click derecho en base de datos 'laburemos' (AWS)"
            Write-Host "3. Selecciona 'Restore...'"
            Write-Host "4. Filename: $backupFile"
            Write-Host "5. Click 'Restore'"
            
            Write-Host ""
            Write-Host "✅ Sincronización completada cuando termines los pasos" -ForegroundColor Green
        } else {
            Write-Host "Operación cancelada" -ForegroundColor Yellow
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "=== SINCRONIZAR AWS → LOCAL (Traer de producción) ===" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "⚠️  IMPORTANTE: Esto sobrescribirá tu base de datos local" -ForegroundColor Red
        $confirm = Read-Host "¿Estás seguro? (escribe 'SI' para continuar)"
        
        if ($confirm -eq "SI") {
            $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
            $backupFile = "laburemos_aws_to_local_$timestamp.sql"
            
            Write-Host ""
            Write-Host "📋 INSTRUCCIONES para pgAdmin4:" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "PASO 1 - Hacer backup de AWS:" -ForegroundColor Green
            Write-Host "1. Click derecho en base de datos 'laburemos' (AWS)"
            Write-Host "2. Selecciona 'Backup...'"
            Write-Host "3. Filename: $backupFile"
            Write-Host "4. Format: Plain"
            Write-Host "5. Click 'Backup'"
            Write-Host ""
            Write-Host "PASO 2 - Hacer backup de LOCAL (recomendado):" -ForegroundColor Green
            Write-Host "1. Click derecho en base de datos 'laburemos' (LOCAL)"
            Write-Host "2. Selecciona 'Backup...'"
            Write-Host "3. Filename: local_backup_before_sync_$timestamp.sql"
            Write-Host "4. Click 'Backup'"
            Write-Host ""
            Write-Host "PASO 3 - Limpiar LOCAL y restaurar:" -ForegroundColor Green
            Write-Host "1. Ejecuta en LOCAL: DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
            Write-Host "2. Click derecho en base de datos 'laburemos' (LOCAL)"
            Write-Host "3. Selecciona 'Restore...'"
            Write-Host "4. Filename: $backupFile"
            Write-Host "5. Click 'Restore'"
            
            Write-Host ""
            Write-Host "✅ Sincronización completada cuando termines los pasos" -ForegroundColor Green
        } else {
            Write-Host "Operación cancelada" -ForegroundColor Yellow
        }
    }
    
    "4" {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "laburemos_local_backup_$timestamp.sql"
        
        Write-Host ""
        Write-Host "=== BACKUP BASE DE DATOS LOCAL ===" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 En pgAdmin4:" -ForegroundColor Cyan
        Write-Host "1. Click derecho en base de datos 'laburemos' (LOCAL)"
        Write-Host "2. Selecciona 'Backup...'"
        Write-Host "3. Filename: $backupFile"
        Write-Host "4. Format: Plain"
        Write-Host "5. Click 'Backup'"
        Write-Host ""
        Write-Host "El backup se guardará como: $backupFile" -ForegroundColor Green
    }
    
    "5" {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "laburemos_aws_backup_$timestamp.sql"
        
        Write-Host ""
        Write-Host "=== BACKUP BASE DE DATOS AWS ===" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 En pgAdmin4:" -ForegroundColor Cyan
        Write-Host "1. Click derecho en base de datos 'laburemos' (AWS)"
        Write-Host "2. Selecciona 'Backup...'"
        Write-Host "3. Filename: $backupFile"
        Write-Host "4. Format: Plain"
        Write-Host "5. Click 'Backup'"
        Write-Host ""
        Write-Host "El backup se guardará como: $backupFile" -ForegroundColor Green
    }
    
    "6" {
        Write-Host ""
        Write-Host "=== REINICIALIZAR BASE DE DATOS LOCAL ===" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "⚠️  PELIGRO: Esto eliminará TODOS los datos locales" -ForegroundColor Red
        $confirm = Read-Host "¿Estás ABSOLUTAMENTE seguro? (escribe 'ELIMINAR' para continuar)"
        
        if ($confirm -eq "ELIMINAR") {
            Write-Host ""
            Write-Host "📋 En pgAdmin4 (base de datos local):" -ForegroundColor Cyan
            Write-Host "1. Ejecuta esta consulta:"
            Write-Host "   DROP SCHEMA public CASCADE;"
            Write-Host "   CREATE SCHEMA public;"
            Write-Host "   GRANT ALL ON SCHEMA public TO postgres;"
            Write-Host "   GRANT ALL ON SCHEMA public TO public;"
            Write-Host ""
            Write-Host "2. Luego ejecuta en la carpeta backend:"
            Write-Host "   npx prisma db push"
            Write-Host ""
            Write-Host "Esto recreará una base de datos completamente limpia" -ForegroundColor Green
        } else {
            Write-Host "Operación cancelada (por seguridad)" -ForegroundColor Yellow
        }
    }
    
    default {
        Write-Host "Opción no válida" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== CONFIGURACIÓN ACTUAL DEL BACKEND ===" -ForegroundColor Cyan
Write-Host "El backend está configurado para usar PostgreSQL local" -ForegroundColor Green
Write-Host "DATABASE_URL: postgresql://postgres:postgres@localhost:5432/laburemos" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar el backend local:" -ForegroundColor Yellow
Write-Host "cd backend"
Write-Host "npm run start:dev"