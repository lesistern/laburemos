# Script PowerShell para configurar pgAdmin4 con AWS RDS
# LABUREMOS - Setup pgAdmin4 para AWS RDS

Write-Host "=== Configuracion de pgAdmin4 para AWS RDS - LABUREMOS ===" -ForegroundColor Cyan
Write-Host ""

# Informacion de conexion
$DB_INSTANCE = "laburemos-db"
$DB_USERNAME = "postgres"
$DB_PASSWORD = "Laburemos2025!"
$DB_NAME = "laburemos"
$DB_PORT = "5432"
$AWS_REGION = "us-east-1"
$RDS_ENDPOINT = "laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"

Write-Host "Informacion de la base de datos RDS:" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow
Write-Host "Instance: $DB_INSTANCE"
Write-Host "Username: $DB_USERNAME"
Write-Host "Database: $DB_NAME"
Write-Host "Port: $DB_PORT"
Write-Host "Region: $AWS_REGION"
Write-Host "Endpoint: $RDS_ENDPOINT" -ForegroundColor Green
Write-Host ""

# Obtener IP actual
Write-Host "Obteniendo tu IP actual..." -ForegroundColor Yellow
try {
    $myIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
    Write-Host "Tu IP es: $myIP" -ForegroundColor Green
} catch {
    Write-Host "No se pudo obtener tu IP automaticamente" -ForegroundColor Red
    $myIP = Read-Host "Por favor, ingresa tu IP manualmente"
}
Write-Host ""

# Crear archivo de configuracion
$CONFIG_FILE = "pgadmin-aws-config.txt"

# Usar Out-File para evitar problemas de encoding
@"
=== Configuracion para pgAdmin4 - LABUREMOS AWS RDS ===

1. INFORMACION DE CONEXION:
   ------------------------
   Name: LaburAR AWS Production
   Host: $RDS_ENDPOINT
   Port: $DB_PORT
   Database: $DB_NAME
   Username: $DB_USERNAME
   Password: $DB_PASSWORD

2. PASOS EN pgAdmin4:
   -----------------
   a) Abre pgAdmin4
   b) Click derecho en "Servers" -> "Register" -> "Server..."
   c) En la pestana "General":
      - Name: LaburAR AWS Production
   d) En la pestana "Connection":
      - Host name/address: $RDS_ENDPOINT
      - Port: $DB_PORT
      - Maintenance database: $DB_NAME
      - Username: $DB_USERNAME
      - Password: $DB_PASSWORD
      - Save password: SI (opcional)
   e) Click en "Save"

3. TU IP PARA AWS SECURITY GROUP:
   ------------------------------
   Tu IP actual: $myIP
   
   En AWS Console:
   - Ve a EC2 -> Security Groups
   - Busca el security group de RDS
   - Edit inbound rules -> Add rule:
     * Type: PostgreSQL
     * Port: 5432
     * Source: $myIP/32
     * Description: pgAdmin desde mi PC

4. COMANDO PARA PROBAR CONEXION:
   -----------------------------
   psql -h $RDS_ENDPOINT -U $DB_USERNAME -d $DB_NAME -p $DB_PORT
"@ | Out-File -FilePath $CONFIG_FILE -Encoding UTF8

Write-Host "Archivo de configuracion creado: $CONFIG_FILE" -ForegroundColor Green
Write-Host ""

Write-Host "RESUMEN:" -ForegroundColor Cyan
Write-Host "========" -ForegroundColor Cyan
Write-Host "1. Configuracion guardada en: $CONFIG_FILE" -ForegroundColor Green
Write-Host "2. Tu IP actual: $myIP" -ForegroundColor Green
Write-Host "3. Endpoint RDS: $RDS_ENDPOINT" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "1. Abre el archivo $CONFIG_FILE para ver los detalles"
Write-Host "2. Configura el Security Group en AWS para permitir tu IP"
Write-Host "3. Abre pgAdmin4 y sigue las instrucciones del archivo"
Write-Host ""
Write-Host "IMPORTANTE: Asegurate de que tu IP ($myIP) este permitida en el Security Group de RDS" -ForegroundColor Red
Write-Host ""
Write-Host "Presiona Enter para abrir el archivo de configuracion..."
Read-Host

# Abrir el archivo de configuracion
Start-Process notepad.exe $CONFIG_FILE