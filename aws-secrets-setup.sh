#!/bin/bash

# AWS Secrets Manager Setup Script para LABUREMOS
# Este script crea y configura los secrets necesarios para la aplicación

set -e

echo "🔐 Configurando AWS Secrets Manager para LABUREMOS"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no está instalado${NC}"
    exit 1
fi

# Verificar configuración AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI no configurado correctamente${NC}"
    exit 1
fi

REGION="us-east-1"
SECRET_NAME="laburemos/production"

echo -e "${BLUE}🔧 Creando secret: ${SECRET_NAME}${NC}"

# 1. Crear el secret principal con todas las credenciales
cat > secret.json << EOF
{
  "DATABASE_URL": "postgresql://laburemos_user:$(openssl rand -base64 32)@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos",
  "JWT_SECRET": "$(openssl rand -base64 64)",
  "JWT_REFRESH_SECRET": "$(openssl rand -base64 64)",
  "SESSION_SECRET": "$(openssl rand -base64 64)",
  "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID:-your-key-here}",
  "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY:-your-secret-here}",
  "STRIPE_SECRET_KEY": "sk_live_your_stripe_key_here",
  "REDIS_URL": "redis://laburemos-redis.cache.amazonaws.com:6379",
  "SMTP_HOST": "email-smtp.us-east-1.amazonaws.com",
  "SMTP_PORT": "587",
  "SMTP_USER": "your-smtp-user",
  "SMTP_PASS": "your-smtp-password"
}
EOF

# Crear o actualizar el secret
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Secret ya existe, actualizando...${NC}"
    aws secretsmanager update-secret \
        --secret-id "$SECRET_NAME" \
        --secret-string file://secret.json \
        --region "$REGION"
else
    echo -e "${GREEN}✅ Creando nuevo secret...${NC}"
    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "LABUREMOS Production Credentials" \
        --secret-string file://secret.json \
        --region "$REGION"
fi

# 2. Crear policy para EC2 access
POLICY_NAME="LaburemosSecretsAccess"
cat > policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            "Resource": "arn:aws:secretsmanager:${REGION}:*:secret:${SECRET_NAME}*"
        }
    ]
}
EOF

# Crear la policy si no existe
if ! aws iam get-policy --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME" &>/dev/null; then
    echo -e "${GREEN}✅ Creando IAM policy...${NC}"
    aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document file://policy.json
fi

# 3. Crear IAM role para EC2
ROLE_NAME="LaburemosEC2Role"
cat > trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

if ! aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
    echo -e "${GREEN}✅ Creando IAM role...${NC}"
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file://trust-policy.json
    
    # Attach policy to role
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/$POLICY_NAME"
    
    # Create instance profile
    aws iam create-instance-profile --instance-profile-name "$ROLE_NAME"
    aws iam add-role-to-instance-profile --instance-profile-name "$ROLE_NAME" --role-name "$ROLE_NAME"
fi

# Limpiar archivos temporales
rm -f secret.json policy.json trust-policy.json

echo -e "${GREEN}✅ AWS Secrets Manager configurado exitosamente${NC}"
echo -e "${YELLOW}📝 Próximos pasos:${NC}"
echo "1. Asignar el IAM role LaburemosEC2Role a tu instancia EC2"
echo "2. Instalar el AWS SDK en el backend: npm install @aws-sdk/client-secrets-manager"
echo "3. Actualizar el código para usar Secrets Manager"
echo "4. Cambiar las credenciales de la base de datos RDS"

echo -e "${BLUE}🔍 Para verificar el secret:${NC}"
echo "aws secretsmanager get-secret-value --secret-id $SECRET_NAME --region $REGION"