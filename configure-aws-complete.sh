#!/bin/bash

# Script completo para configurar AWS para laburemos.com.ar
# Requiere AWS CLI configurado con credenciales válidas

echo "=== Configuración completa de AWS para laburemos.com.ar ==="
echo ""

# Variables
DOMAIN="laburemos.com.ar"
CLOUDFRONT_ID="E1E1QZ7YLALIAZ"
EC2_IP="3.81.56.168"
CERTIFICATE_ARN="arn:aws:acm:us-east-1:529496937346:certificate/94aa65d0-875b-4556-ae27-0c1f49f0b886"
AWS_ACCOUNT="529496937346"
AWS_REGION="us-east-1"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar comandos
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 no está instalado${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 está disponible${NC}"
        return 0
    fi
}

# Verificar AWS CLI
echo "1. Verificando herramientas..."
if ! check_command aws; then
    # Intentar usar la versión local
    if [ -f "./aws/dist/aws" ]; then
        echo "Usando AWS CLI local..."
        alias aws="./aws/dist/aws"
    else
        echo -e "${RED}AWS CLI no está disponible. Por favor, instálalo primero.${NC}"
        exit 1
    fi
fi

# Verificar credenciales AWS
echo ""
echo "2. Verificando credenciales AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ No hay credenciales AWS configuradas${NC}"
    echo "Por favor, configura AWS CLI con: aws configure"
    echo "Necesitas:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region: us-east-1"
    exit 1
else
    ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
    echo -e "${GREEN}✅ Credenciales configuradas para cuenta: $ACCOUNT_ID${NC}"
fi

# Task 1: Configurar Route 53
echo ""
echo "3. Configurando Route 53 para $DOMAIN..."

# Verificar si la hosted zone existe
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --query "HostedZones[?Name=='${DOMAIN}.'].Id" --output text 2>/dev/null | cut -d'/' -f3)

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo -e "${YELLOW}Creando nueva hosted zone para $DOMAIN...${NC}"
    CREATE_RESULT=$(aws route53 create-hosted-zone \
        --name $DOMAIN \
        --caller-reference "laburemos-$(date +%s)" \
        --query 'HostedZone.Id' \
        --output text 2>&1)
    
    if [ $? -eq 0 ]; then
        HOSTED_ZONE_ID=$(echo $CREATE_RESULT | cut -d'/' -f3)
        echo -e "${GREEN}✅ Hosted zone creada: $HOSTED_ZONE_ID${NC}"
        
        # Obtener los name servers
        echo "Name servers para configurar en NIC.ar:"
        aws route53 get-hosted-zone --id $HOSTED_ZONE_ID --query 'DelegationSet.NameServers' --output table
    else
        echo -e "${RED}❌ Error creando hosted zone: $CREATE_RESULT${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Hosted zone encontrada: $HOSTED_ZONE_ID${NC}"
fi

# Crear archivo de cambios para Route 53
cat > route53-changes.json << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "${DOMAIN}",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "Z2FDTNDATAQYW2",
                    "DNSName": "d2ijlktcsmmfsd.cloudfront.net",
                    "EvaluateTargetHealth": false
                }
            }
        },
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "www.${DOMAIN}",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "Z2FDTNDATAQYW2",
                    "DNSName": "d2ijlktcsmmfsd.cloudfront.net",
                    "EvaluateTargetHealth": false
                }
            }
        }
    ]
}
EOF

# Aplicar cambios en Route 53
echo "Configurando registros DNS..."
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://route53-changes.json \
    --query 'ChangeInfo.Id' \
    --output text 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Registros DNS configurados correctamente${NC}"
    echo "Change ID: $CHANGE_ID"
else
    echo -e "${RED}❌ Error configurando registros DNS: $CHANGE_ID${NC}"
fi

# Task 2: Verificar servicios backend en EC2
echo ""
echo "4. Verificando servicios backend en EC2..."

# Verificar conectividad
echo "Verificando conectividad con EC2 ($EC2_IP)..."
if ping -c 1 -W 2 $EC2_IP &> /dev/null; then
    echo -e "${GREEN}✅ EC2 accesible${NC}"
    
    # Verificar servicios HTTP
    echo "Verificando servicios:"
    
    # Puerto 3001
    if curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP:3001 | grep -q "200\|404"; then
        echo -e "${GREEN}✅ Servicio en puerto 3001 activo${NC}"
    else
        echo -e "${RED}❌ Servicio en puerto 3001 no responde${NC}"
    fi
    
    # Puerto 3002
    if curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP:3002 | grep -q "200\|404"; then
        echo -e "${GREEN}✅ Servicio en puerto 3002 activo${NC}"
    else
        echo -e "${YELLOW}⚠️  Servicio en puerto 3002 no responde${NC}"
    fi
else
    echo -e "${RED}❌ No se puede conectar a EC2${NC}"
fi

# Task 3: Verificar Security Groups
echo ""
echo "5. Verificando Security Groups de EC2..."

# Obtener instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
    --filters "Name=network-interface.addresses.association.public-ip,Values=$EC2_IP" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text 2>/dev/null)

if [ "$INSTANCE_ID" != "None" ] && [ ! -z "$INSTANCE_ID" ]; then
    echo "Instance ID: $INSTANCE_ID"
    
    # Obtener Security Groups
    SG_IDS=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --query 'Reservations[0].Instances[0].SecurityGroups[*].GroupId' \
        --output text)
    
    echo "Security Groups: $SG_IDS"
    
    # Verificar reglas para puertos 3001 y 3002
    for SG_ID in $SG_IDS; do
        echo "Verificando Security Group: $SG_ID"
        
        # Verificar puerto 3001
        PORT_3001=$(aws ec2 describe-security-groups \
            --group-ids $SG_ID \
            --query "SecurityGroups[0].IpPermissions[?FromPort==\`3001\`]" \
            --output text 2>/dev/null)
        
        if [ -z "$PORT_3001" ]; then
            echo -e "${YELLOW}⚠️  Puerto 3001 no está abierto en $SG_ID${NC}"
            echo "Agregando regla para puerto 3001..."
            aws ec2 authorize-security-group-ingress \
                --group-id $SG_ID \
                --protocol tcp \
                --port 3001 \
                --cidr 0.0.0.0/0 \
                --group-rule-description "Backend API port" 2>&1
        else
            echo -e "${GREEN}✅ Puerto 3001 abierto${NC}"
        fi
        
        # Verificar puerto 3002
        PORT_3002=$(aws ec2 describe-security-groups \
            --group-ids $SG_ID \
            --query "SecurityGroups[0].IpPermissions[?FromPort==\`3002\`]" \
            --output text 2>/dev/null)
        
        if [ -z "$PORT_3002" ]; then
            echo -e "${YELLOW}⚠️  Puerto 3002 no está abierto en $SG_ID${NC}"
            echo "Agregando regla para puerto 3002..."
            aws ec2 authorize-security-group-ingress \
                --group-id $SG_ID \
                --protocol tcp \
                --port 3002 \
                --cidr 0.0.0.0/0 \
                --group-rule-description "NestJS Backend port" 2>&1
        else
            echo -e "${GREEN}✅ Puerto 3002 abierto${NC}"
        fi
    done
else
    echo -e "${RED}❌ No se pudo obtener información de la instancia EC2${NC}"
fi

# Task 4: Verificar estado del certificado SSL
echo ""
echo "6. Verificando certificado SSL..."
CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn "$CERTIFICATE_ARN" \
    --region $AWS_REGION \
    --query 'Certificate.Status' \
    --output text 2>/dev/null)

echo "Estado del certificado: $CERT_STATUS"

if [ "$CERT_STATUS" == "ISSUED" ]; then
    echo -e "${GREEN}✅ Certificado SSL válido y listo${NC}"
    echo ""
    echo "7. ¿Deseas actualizar CloudFront con el dominio personalizado ahora? (s/n)"
    read -r response
    if [[ "$response" =~ ^([sS][íiÍI]|[sS])$ ]]; then
        echo "Ejecutando script de actualización de CloudFront..."
        if [ -f "./update-cloudfront-domain.sh" ]; then
            chmod +x ./update-cloudfront-domain.sh
            ./update-cloudfront-domain.sh
        else
            echo -e "${RED}❌ No se encontró update-cloudfront-domain.sh${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  El certificado aún no está validado${NC}"
    echo "Verificando registros de validación DNS..."
    
    # Obtener registros de validación
    aws acm describe-certificate \
        --certificate-arn "$CERTIFICATE_ARN" \
        --region $AWS_REGION \
        --query 'Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord.Name,ResourceRecord.Value]' \
        --output table
fi

# Resumen final
echo ""
echo "=== RESUMEN DE CONFIGURACIÓN ==="
echo ""
echo -e "${GREEN}URLs de Producción:${NC}"
echo "  Frontend: https://$DOMAIN (cuando DNS propague)"
echo "  Frontend: https://www.$DOMAIN"
echo "  CloudFront: https://d2ijlktcsmmfsd.cloudfront.net"
echo "  Backend API: http://$EC2_IP:3001"
echo "  NestJS API: http://$EC2_IP:3002"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Configurar los name servers en NIC.ar con los valores de Route 53"
echo "2. Esperar propagación DNS (2-48 horas)"
echo "3. Cuando el certificado esté validado, ejecutar: ./update-cloudfront-domain.sh"
echo "4. Verificar servicios backend y reiniciar si es necesario"
echo ""

# Limpiar archivos temporales
rm -f route53-changes.json cloudfront-config-updated.json

echo "=== Configuración completada ==="