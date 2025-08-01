#!/bin/bash

# Script para actualizar CloudFront con dominio personalizado
CERTIFICATE_ARN="arn:aws:acm:us-east-1:529496937346:certificate/94aa65d0-875b-4556-ae27-0c1f49f0b886"
DISTRIBUTION_ID="E1E1QZ7YLALIAZ"
AWS_CLI="./aws/dist/aws"

echo "🔧 Actualizando CloudFront con dominio laburemos.com.ar"
echo "========================================================"

# Verificar estado del certificado
echo "1. Verificando certificado SSL..."
CERT_STATUS=$($AWS_CLI acm describe-certificate --certificate-arn "$CERTIFICATE_ARN" --region us-east-1 --query 'Certificate.Status' --output text 2>/dev/null)
echo "   Estado del certificado: $CERT_STATUS"

if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo "❌ El certificado aún no está validado. Estado: $CERT_STATUS"
    echo "⏳ Esperando validación automática..."
    exit 1
fi

echo "✅ Certificado SSL validado correctamente"

# Obtener configuración actual de CloudFront
echo ""
echo "2. Obteniendo configuración actual de CloudFront..."
CURRENT_CONFIG=$($AWS_CLI cloudfront get-distribution-config --id $DISTRIBUTION_ID 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Error obteniendo configuración de CloudFront"
    exit 1
fi

# Extraer ETag
ETAG=$(echo "$CURRENT_CONFIG" | grep '"ETag"' | sed 's/.*"ETag": *"\([^"]*\)".*/\1/')
echo "   ETag actual: $ETAG"

# Crear configuración actualizada con SSL
echo ""
echo "3. Creando configuración con dominio personalizado y SSL..."

cat > cloudfront-config-updated.json << EOF
{
    "CallerReference": "laburemos-frontend-$(date +%s)",
    "Aliases": {
        "Quantity": 2,
        "Items": [
            "laburemos.com.ar",
            "www.laburemos.com.ar"
        ]
    },
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-laburemos-files-2025",
                "DomainName": "laburemos-files-2025.s3.amazonaws.com",
                "OriginPath": "",
                "CustomHeaders": {
                    "Quantity": 0
                },
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "OriginGroups": {
        "Quantity": 0
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-laburemos-files-2025",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "TrustedKeyGroups": {
            "Enabled": false,
            "Quantity": 0
        },
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 7,
            "Items": [
                "DELETE",
                "GET", 
                "HEAD",
                "OPTIONS",
                "PATCH",
                "POST",
                "PUT"
            ],
            "CachedMethods": {
                "Quantity": 2,
                "Items": [
                    "HEAD",
                    "GET"
                ]
            }
        },
        "SmoothStreaming": false,
        "Compress": true,
        "LambdaFunctionAssociations": {
            "Quantity": 0
        },
        "FunctionAssociations": {
            "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            },
            "Headers": {
                "Quantity": 0
            },
            "QueryStringCacheKeys": {
                "Quantity": 0
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "CacheBehaviors": {
        "Quantity": 0
    },
    "CustomErrorResponses": {
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
    },
    "Comment": "LABUREMOS Frontend Distribution - laburemos.com.ar with SSL",
    "Logging": {
        "Enabled": false,
        "IncludeCookies": false,
        "Bucket": "",
        "Prefix": ""
    },
    "PriceClass": "PriceClass_100",
    "Enabled": true,
    "ViewerCertificate": {
        "ACMCertificateArn": "$CERTIFICATE_ARN",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021",
        "CertificateSource": "acm"
    },
    "Restrictions": {
        "GeoRestriction": {
            "RestrictionType": "none",
            "Quantity": 0
        }
    },
    "WebACLId": "",
    "HttpVersion": "http2",
    "IsIPV6Enabled": true,
    "ContinuousDeploymentPolicyId": "",
    "Staging": false
}
EOF

echo "   Configuración creada con:"
echo "   - Dominios: laburemos.com.ar, www.laburemos.com.ar"
echo "   - SSL Certificate: $(echo $CERTIFICATE_ARN | cut -d'/' -f2)"
echo "   - Error handling: 403/404 → index.html"
echo "   - HTTPS redirect: Habilitado"

# Actualizar CloudFront
echo ""
echo "4. Actualizando distribución de CloudFront..."
UPDATE_RESULT=$($AWS_CLI cloudfront update-distribution \
    --id $DISTRIBUTION_ID \
    --distribution-config file://cloudfront-config-updated.json \
    --if-match "$ETAG" 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ CloudFront actualizado exitosamente"
    echo ""
    echo "🌐 URLs configuradas:"
    echo "   - https://laburemos.com.ar"
    echo "   - https://www.laburemos.com.ar" 
    echo "   - https://d2ijlktcsmmfsd.cloudfront.net (backup)"
    echo ""
    echo "🔧 Backend API:"
    echo "   - http://3.81.56.168:3001"
    echo ""
    echo "⏳ Propagación de CloudFront: 15-20 minutos"
    echo "📊 Estado: SSL validado, dominios configurados"
    
    # Limpiar archivos temporales
    rm -f cloudfront-config-updated.json
    
else
    echo "❌ Error actualizando CloudFront:"
    echo "$UPDATE_RESULT"
    echo ""
    echo "🔍 Posibles causas:"
    echo "   - ETag incorrecto (distribución modificada durante la operación)"
    echo "   - Configuración JSON inválida"
    echo "   - Permisos de AWS insuficientes"
    exit 1
fi

echo ""
echo "========================================================="
echo "🎉 Configuración completada exitosamente"
echo "🔗 Prueba: https://laburemos.com.ar (en 15-20 minutos)"