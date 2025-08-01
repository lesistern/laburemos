#!/bin/bash

# Script interactivo para configurar AWS y ejecutar la configuración completa

echo "=== Configuración Interactiva de AWS para laburemos.com.ar ==="
echo ""
echo "Este script te guiará paso a paso para configurar AWS."
echo ""

# Función para leer entrada segura
read_secure() {
    local prompt="$1"
    local var_name="$2"
    echo -n "$prompt"
    read -s $var_name
    echo ""
}

# Solicitar credenciales
echo "Por favor, ingresa las credenciales de AWS:"
echo "(Puedes encontrarlas en la consola de AWS → IAM → Users → Security credentials)"
echo ""

read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
read_secure "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
read -p "Default region [us-east-1]: " AWS_DEFAULT_REGION

# Usar valores por defecto si están vacíos
AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-us-east-1}

# Crear directorio AWS si no existe
mkdir -p ~/.aws

# Crear archivo de credenciales
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY
EOF

# Crear archivo de configuración
cat > ~/.aws/config << EOF
[default]
region = $AWS_DEFAULT_REGION
output = json
EOF

echo ""
echo "✅ Credenciales configuradas"
echo ""

# Verificar credenciales
echo "Verificando credenciales..."
if ./aws/dist/aws sts get-caller-identity > /dev/null 2>&1; then
    ACCOUNT_ID=$(./aws/dist/aws sts get-caller-identity --query 'Account' --output text)
    echo "✅ Credenciales válidas para cuenta: $ACCOUNT_ID"
    echo ""
    
    # Preguntar si desea continuar
    read -p "¿Deseas continuar con la configuración completa? (s/n): " CONTINUE
    
    if [[ "$CONTINUE" =~ ^([sS][íiÍI]|[sS])$ ]]; then
        echo ""
        echo "Ejecutando configuración completa..."
        echo ""
        
        # Ejecutar el script principal con AWS CLI configurado
        export PATH="$PWD/aws/dist:$PATH"
        ./configure-aws-complete.sh
    else
        echo "Configuración cancelada. Puedes ejecutar './configure-aws-complete.sh' cuando estés listo."
    fi
else
    echo "❌ Error: Las credenciales no son válidas"
    echo "Por favor, verifica las credenciales e intenta nuevamente."
    exit 1
fi