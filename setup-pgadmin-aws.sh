#!/bin/bash

# Script para configurar pgAdmin4 con AWS RDS PostgreSQL
# LABUREMOS - Setup pgAdmin4 para AWS RDS

echo "=== Configuración de pgAdmin4 para AWS RDS - LABUREMOS ==="
echo ""

# Información de conexión
DB_INSTANCE="laburemos-db"
DB_USERNAME="postgres"
DB_PASSWORD="Laburemos2025!"
DB_NAME="laburemos"
DB_PORT="5432"
AWS_REGION="us-east-1"

echo "📊 Información de la base de datos RDS:"
echo "=================================="
echo "Instance: $DB_INSTANCE"
echo "Username: $DB_USERNAME"
echo "Database: $DB_NAME"
echo "Port: $DB_PORT"
echo "Region: $AWS_REGION"
echo ""

# Verificar si AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI no está instalado. Por favor, instálalo primero."
    echo "   Visita: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Obtener el endpoint de RDS
echo "🔍 Obteniendo endpoint de RDS..."
RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE --region $AWS_REGION --query 'DBInstances[0].Endpoint.Address' --output text 2>/dev/null)

if [ -z "$RDS_ENDPOINT" ] || [ "$RDS_ENDPOINT" = "None" ]; then
    echo "❌ No se pudo obtener el endpoint de RDS automáticamente."
    echo ""
    echo "📝 Por favor, obtén el endpoint manualmente desde la consola de AWS:"
    echo "   1. Ve a https://console.aws.amazon.com/rds/"
    echo "   2. Selecciona la región: $AWS_REGION"
    echo "   3. Busca la instancia: $DB_INSTANCE"
    echo "   4. Copia el Endpoint (algo como: laburemos-db.xxxxx.us-east-1.rds.amazonaws.com)"
    echo ""
    read -p "Ingresa el endpoint de RDS: " RDS_ENDPOINT
fi

echo "✅ Endpoint encontrado: $RDS_ENDPOINT"
echo ""

# Crear archivo de configuración para pgAdmin
CONFIG_FILE="pgadmin-aws-config.txt"
echo "📄 Creando archivo de configuración: $CONFIG_FILE"

cat > $CONFIG_FILE << EOF
=== Configuración para pgAdmin4 - LABUREMOS AWS RDS ===

1. INFORMACIÓN DE CONEXIÓN:
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
   b) Click derecho en "Servers" → "Register" → "Server..."
   c) En la pestaña "General":
      - Name: LaburAR AWS Production
   d) En la pestaña "Connection":
      - Host name/address: $RDS_ENDPOINT
      - Port: $DB_PORT
      - Maintenance database: $DB_NAME
      - Username: $DB_USERNAME
      - Password: $DB_PASSWORD
      - Save password: ✓ (opcional)
   e) Click en "Save"

3. SOLUCIÓN DE PROBLEMAS:
   ---------------------
   Si no puedes conectarte:
   
   a) Verifica el Security Group en AWS:
      - Ve a EC2 → Security Groups
      - Busca el security group de RDS
      - Asegúrate que tenga una regla:
        Type: PostgreSQL
        Port: 5432
        Source: 0.0.0.0/0 (o tu IP específica)
   
   b) Verifica que RDS sea publicly accessible:
      - En RDS → Instances → laburemos-db
      - Publicly accessible: Yes
   
   c) Prueba la conexión con psql:
      psql -h $RDS_ENDPOINT -U $DB_USERNAME -d $DB_NAME -p $DB_PORT

EOF

echo "✅ Archivo de configuración creado: $CONFIG_FILE"
echo ""

# Verificar el security group
echo "🔒 Verificando configuración de seguridad..."
SECURITY_GROUP=$(aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE --region $AWS_REGION --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' --output text 2>/dev/null)

if [ ! -z "$SECURITY_GROUP" ] && [ "$SECURITY_GROUP" != "None" ]; then
    echo "Security Group: $SECURITY_GROUP"
    echo ""
    echo "📝 Para permitir conexiones desde tu IP:"
    echo "   aws ec2 authorize-security-group-ingress \\"
    echo "     --group-id $SECURITY_GROUP \\"
    echo "     --protocol tcp \\"
    echo "     --port 5432 \\"
    echo "     --cidr YOUR_IP/32 \\"
    echo "     --region $AWS_REGION"
fi

# Probar conexión
echo ""
echo "🔧 Para probar la conexión manualmente:"
echo "psql -h $RDS_ENDPOINT -U $DB_USERNAME -d $DB_NAME -p $DB_PORT"
echo ""

# Crear script de backup
BACKUP_SCRIPT="backup-aws-db.sh"
cat > $BACKUP_SCRIPT << 'EOF'
#!/bin/bash
# Script para hacer backup de la base de datos AWS RDS

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="laburemos_aws_backup_$TIMESTAMP.sql"

echo "Haciendo backup de la base de datos AWS..."
EOF

echo "RDS_ENDPOINT=\"$RDS_ENDPOINT\"" >> $BACKUP_SCRIPT
echo "DB_USERNAME=\"$DB_USERNAME\"" >> $BACKUP_SCRIPT
echo "DB_NAME=\"$DB_NAME\"" >> $BACKUP_SCRIPT
echo "DB_PORT=\"$DB_PORT\"" >> $BACKUP_SCRIPT

cat >> $BACKUP_SCRIPT << 'EOF'

# Solicitar contraseña de forma segura
echo -n "Ingresa la contraseña de la base de datos: "
read -s DB_PASSWORD
echo ""

# Hacer el backup
PGPASSWORD=$DB_PASSWORD pg_dump -h $RDS_ENDPOINT -U $DB_USERNAME -d $DB_NAME -p $DB_PORT -f $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup completado: $BACKUP_FILE"
    echo "Tamaño: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ Error al hacer el backup"
fi
EOF

chmod +x $BACKUP_SCRIPT
echo "✅ Script de backup creado: $BACKUP_SCRIPT"
echo ""

echo "📌 RESUMEN:"
echo "==========="
echo "1. Configuración guardada en: $CONFIG_FILE"
echo "2. Script de backup en: $BACKUP_SCRIPT"
echo "3. Endpoint RDS: $RDS_ENDPOINT"
echo ""
echo "🚀 Ahora puedes abrir pgAdmin4 y usar la información en $CONFIG_FILE"
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de que tu IP esté permitida en el Security Group de RDS"