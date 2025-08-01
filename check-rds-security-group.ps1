# Script para verificar el Security Group de RDS
Write-Host "=== Verificando Security Group de RDS ===" -ForegroundColor Cyan
Write-Host ""

# Verificar cual security group usa RDS
$RDS_SG = aws rds describe-db-instances `
    --db-instance-identifier laburemos-db `
    --region us-east-1 `
    --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' `
    --output text 2>$null

if ($RDS_SG) {
    Write-Host "RDS está usando el Security Group: $RDS_SG" -ForegroundColor Green
    
    # Verificar las reglas actuales
    Write-Host ""
    Write-Host "Reglas actuales de entrada para PostgreSQL (5432):" -ForegroundColor Yellow
    
    aws ec2 describe-security-groups `
        --group-ids $RDS_SG `
        --region us-east-1 `
        --query 'SecurityGroups[0].IpPermissions[?FromPort==`5432`].[IpRanges[].CidrIp]' `
        --output table
} else {
    Write-Host "No se pudo determinar el Security Group de RDS" -ForegroundColor Red
    Write-Host ""
    Write-Host "Security Groups disponibles:" -ForegroundColor Yellow
    Write-Host "1. sg-012c8083bc798abb4 (default) - Probablemente este es el de RDS"
    Write-Host "2. sg-00099829a04cca633 (laburemos-sg) - Este es para el backend EC2"
}

Write-Host ""
Write-Host "Tu IP que necesita ser agregada: 186.182.67.72/32" -ForegroundColor Cyan