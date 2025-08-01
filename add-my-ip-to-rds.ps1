# Script para agregar tu IP al Security Group de RDS
# LABUREMOS - Permitir acceso desde pgAdmin

$MY_IP = "186.182.67.72"
$AWS_REGION = "us-east-1"

Write-Host "=== Agregando IP al Security Group de RDS ===" -ForegroundColor Cyan
Write-Host "Tu IP: $MY_IP" -ForegroundColor Green
Write-Host ""

# Primero, obtener el Security Group ID de la instancia RDS
Write-Host "Obteniendo Security Group de RDS..." -ForegroundColor Yellow

$SG_ID = aws rds describe-db-instances `
    --db-instance-identifier laburemos-db `
    --region $AWS_REGION `
    --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' `
    --output text

if ($SG_ID -and $SG_ID -ne "None") {
    Write-Host "Security Group encontrado: $SG_ID" -ForegroundColor Green
    
    # Agregar la regla
    Write-Host ""
    Write-Host "Agregando regla para permitir PostgreSQL desde tu IP..." -ForegroundColor Yellow
    
    try {
        aws ec2 authorize-security-group-ingress `
            --group-id $SG_ID `
            --protocol tcp `
            --port 5432 `
            --cidr "$MY_IP/32" `
            --region $AWS_REGION `
            --group-rule-description "pgAdmin desde Argentina - 186.182.67.72"
        
        Write-Host "✅ Regla agregada exitosamente!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ahora puedes conectarte desde pgAdmin4" -ForegroundColor Green
    } catch {
        Write-Host "Error al agregar la regla. Posibles causas:" -ForegroundColor Red
        Write-Host "- La regla ya existe"
        Write-Host "- No tienes permisos suficientes"
        Write-Host "- AWS CLI no está configurado correctamente"
        Write-Host ""
        Write-Host "Intenta agregarlo manualmente desde la consola AWS" -ForegroundColor Yellow
    }
} else {
    Write-Host "No se pudo obtener el Security Group ID" -ForegroundColor Red
    Write-Host "Por favor, agrégalo manualmente desde la consola AWS" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Información de conexión para pgAdmin4:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Host: laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"
Write-Host "Port: 5432"
Write-Host "Database: laburemos"
Write-Host "Username: postgres"
Write-Host "Password: Laburemos2025!"