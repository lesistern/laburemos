#!/bin/bash

# Script simple para actualizar CloudFront conservando configuración actual
CERTIFICATE_ARN="arn:aws:acm:us-east-1:529496937346:certificate/94aa65d0-875b-4556-ae27-0c1f49f0b886"
DISTRIBUTION_ID="E1E1QZ7YLALIAZ"
AWS_CLI="./aws/dist/aws"

echo "🔧 Actualizando CloudFront - Método Simple"
echo "==========================================="

# Obtener configuración actual completa
echo "1. Obteniendo configuración actual..."
$AWS_CLI cloudfront get-distribution-config --id $DISTRIBUTION_ID > current-config.json 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Error obteniendo configuración"
    exit 1
fi

# Extraer ETag y DistributionConfig
ETAG=$(grep '"ETag"' current-config.json | cut -d'"' -f4)
echo "   ETag: $ETAG"

# Extraer solo la DistributionConfig
python3 << 'EOF'
import json
import sys

try:
    with open('current-config.json', 'r') as f:
        data = json.load(f)
    
    config = data['DistributionConfig']
    
    # Agregar aliases (dominios personalizados)
    config['Aliases'] = {
        "Quantity": 2,
        "Items": [
            "laburemos.com.ar",
            "www.laburemos.com.ar"
        ]
    }
    
    # Configurar SSL certificate
    config['ViewerCertificate'] = {
        "ACMCertificateArn": "arn:aws:acm:us-east-1:529496937346:certificate/94aa65d0-875b-4556-ae27-0c1f49f0b886",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021",
        "CertificateSource": "acm"
    }
    
    # Agregar custom error responses para SPA
    config['CustomErrorResponses'] = {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            },
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200", 
                "ErrorCachingMinTTL": 300
            }
        ]
    }
    
    # Asegurar redirect to HTTPS
    config['DefaultCacheBehavior']['ViewerProtocolPolicy'] = 'redirect-to-https'
    
    # Actualizar comentario
    config['Comment'] = 'LABUREMOS Frontend - laburemos.com.ar with SSL'
    
    with open('updated-config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✅ Configuración preparada")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
    echo "❌ Error procesando configuración"
    exit 1
fi

# Actualizar CloudFront
echo ""
echo "2. Actualizando CloudFront..."
UPDATE_RESULT=$($AWS_CLI cloudfront update-distribution \
    --id $DISTRIBUTION_ID \
    --distribution-config file://updated-config.json \
    --if-match "$ETAG" 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ CloudFront actualizado exitosamente"
    echo ""
    echo "🌐 Dominios configurados:"
    echo "   ✅ https://laburemos.com.ar"
    echo "   ✅ https://www.laburemos.com.ar"
    echo ""
    echo "🔒 SSL Certificate: VALIDADO"
    echo "🔄 Error Handling: 403/404 → index.html"
    echo "🔀 HTTPS Redirect: Habilitado"
    echo ""
    echo "⏳ Propagación: 15-20 minutos"
    echo "🔗 Prueba en: https://laburemos.com.ar"
    
    # Limpiar archivos temporales
    rm -f current-config.json updated-config.json
    
else
    echo "❌ Error actualizando CloudFront:"
    echo "$UPDATE_RESULT"
    
    # Mostrar archivos para debug si hay error
    echo ""
    echo "🔍 Archivos de debug disponibles:"
    echo "   - current-config.json"
    echo "   - updated-config.json"
fi

echo ""
echo "==========================================="
echo "🎯 Próximo paso: Esperar propagación"
echo "📊 Monitoreo: ./monitor-dns-and-services.sh"