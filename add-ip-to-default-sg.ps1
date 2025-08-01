# Agregar IP al Security Group default (sg-012c8083bc798abb4)
$SG_ID = "sg-012c8083bc798abb4"  # Security Group default
$MY_IP = "186.182.67.72"
$AWS_REGION = "us-east-1"

Write-Host "Agregando tu IP al Security Group default..." -ForegroundColor Yellow

aws ec2 authorize-security-group-ingress `
    --group-id $SG_ID `
    --protocol tcp `
    --port 5432 `
    --cidr "$MY_IP/32" `
    --region $AWS_REGION `
    --group-rule-description "pgAdmin desde Argentina"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Regla agregada exitosamente!" -ForegroundColor Green
} else {
    Write-Host "❌ Error al agregar la regla (puede que ya exista)" -ForegroundColor Red
}