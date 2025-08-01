#!/bin/bash

# Script para actualizar CloudFront con dominio personalizado
CERTIFICATE_ARN="arn:aws:acm:us-east-1:529496937346:certificate/94aa65d0-875b-4556-ae27-0c1f49f0b886"
DISTRIBUTION_ID="E1E1QZ7YLALIAZ"

echo "=== Actualizando CloudFront con dominio laburemos.com.ar ==="

# Verificar estado del certificado
echo "Verificando certificado SSL..."
CERT_STATUS=$(aws acm describe-certificate --certificate-arn "$CERTIFICATE_ARN" --region us-east-1 --query 'Certificate.Status' --output text)
echo "Estado del certificado: $CERT_STATUS"

if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo "❌ El certificado aún no está validado. Estado: $CERT_STATUS"
    echo "Esperando validación automática..."
    exit 1
fi

echo "✅ Certificado SSL validado correctamente"

# Obtener ETag actual
echo "Obteniendo configuración actual de CloudFront..."
ETAG=$(aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --query 'ETag' --output text)
echo "ETag actual: $ETAG"

# Crear configuración actualizada
echo "Creando configuración con dominio personalizado..."
cat > cloudfront-config-updated.json << EOF
{
    "CallerReference": "laburemos-frontend-1753927153",
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
                    "OriginAccessIdentity": "",
                    "OriginReadTimeout": 30
                },
                "ConnectionAttempts": 3,
                "ConnectionTimeout": 10,
                "OriginShield": {
                    "Enabled": false
                },
                "OriginAccessControlId": ""
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
            "Quantity": 2,
            "Items": [
                "HEAD",
                "GET"
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
        "GrpcConfig": {
            "Enabled": false
        },
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
        "Quantity": 0
    },
    "Comment": "LABUREMOS Frontend Distribution - laburemos.com.ar",
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

# Actualizar CloudFront
echo "Actualizando distribución de CloudFront..."
aws cloudfront update-distribution \
    --id $DISTRIBUTION_ID \
    --distribution-config file://cloudfront-config-updated.json \
    --if-match $ETAG \
    --query 'Distribution.DomainName' \
    --output text

if [ $? -eq 0 ]; then
    echo "✅ CloudFront actualizado exitosamente"
    echo "🌐 Dominio configurado: https://laburemos.com.ar"
    echo "🌐 Dominio www: https://www.laburemos.com.ar"
    echo ""
    echo "⏳ La propagación puede tomar 15-20 minutos"
    echo "📊 Backend API: http://3.81.56.168:3001"
else
    echo "❌ Error actualizando CloudFront"
    exit 1
fi

echo "=== Configuración completada ==="