#!/bin/bash

# Script para configurar credenciales AWS
echo "=== Configuración de credenciales AWS ==="
echo ""

# Crear directorio .aws si no existe
mkdir -p ~/.aws

# Función para configurar credenciales
configure_aws() {
    echo "Por favor, ingresa tus credenciales AWS:"
    echo ""
    
    read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
    read -s -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
    echo ""
    read -p "Default region [us-east-1]: " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}
    
    # Crear archivo de credenciales
    cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY
EOF

    # Crear archivo de config
    cat > ~/.aws/config << EOF
[default]
region = $AWS_REGION
output = json
EOF

    chmod 600 ~/.aws/credentials
    chmod 600 ~/.aws/config
    
    echo ""
    echo "✅ Credenciales configuradas"
}

# Verificar si ya existen credenciales
if [ -f ~/.aws/credentials ]; then
    echo "Ya existen credenciales AWS configuradas."
    echo "¿Deseas reemplazarlas? (s/n)"
    read -r response
    if [[ "$response" =~ ^([sS][íiÍI]|[sS])$ ]]; then
        configure_aws
    fi
else
    configure_aws
fi

# Verificar credenciales
echo ""
echo "Verificando credenciales..."

# Usar AWS CLI local si existe
if [ -f "./aws/dist/aws" ]; then
    AWS_CMD="./aws/dist/aws"
else
    AWS_CMD="aws"
fi

if $AWS_CMD sts get-caller-identity &> /dev/null; then
    echo "✅ Credenciales válidas"
    echo ""
    echo "Información de la cuenta:"
    $AWS_CMD sts get-caller-identity --output table
else
    echo "❌ Error: Las credenciales no son válidas"
    exit 1
fi

echo ""
echo "=== Configuración completada ==="
echo ""
echo "Ahora puedes ejecutar:"
echo "  ./configure-aws-complete.sh    # Para configurar Route 53 y verificar servicios"
echo "  ./restart-ec2-services.sh      # Para reiniciar servicios backend"
echo "  ./update-cloudfront-domain.sh  # Para actualizar CloudFront (cuando el certificado esté listo)"