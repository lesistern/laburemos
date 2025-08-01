#!/bin/bash

# AWS WAF v2 Setup Script para LABUREMOS CloudFront
# Protección DDoS, rate limiting y filtros de seguridad avanzados

set -e

echo "🛡️  Configurando AWS WAF v2 para LABUREMOS"

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

REGION="us-east-1"  # WAF para CloudFront debe estar en us-east-1
WAF_NAME="LaburemosWebACL"
CLOUDFRONT_DISTRIBUTION_ID="E1E1QZ7YLALIAZ"

echo -e "${BLUE}🔧 Creando Web ACL: ${WAF_NAME}${NC}"

# 1. Crear IP Set para IPs de confianza (opcional)
echo -e "${GREEN}✅ Creando IP Set para IPs de confianza...${NC}"
cat > trusted-ips.json << EOF
{
    "Name": "LaburemosTrustedIPs",
    "Scope": "CLOUDFRONT",
    "Description": "IPs de confianza para LABUREMOS",
    "IPAddressVersion": "IPV4",
    "Addresses": []
}
EOF

aws wafv2 create-ip-set \
    --name "LaburemosTrustedIPs" \
    --scope CLOUDFRONT \
    --description "IPs de confianza para LABUREMOS" \
    --ip-address-version IPV4 \
    --addresses \
    --region "$REGION" || echo "IP Set ya existe"

# 2. Crear Web ACL con reglas de seguridad
echo -e "${GREEN}✅ Creando Web ACL con reglas de seguridad...${NC}"
cat > web-acl.json << EOF
{
    "Name": "${WAF_NAME}",
    "Scope": "CLOUDFRONT",
    "DefaultAction": {
        "Allow": {}
    },
    "Description": "Web ACL para protección de LABUREMOS",
    "Rules": [
        {
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 1,
            "OverrideAction": {
                "None": {}
            },
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesCommonRuleSet"
                }
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "CommonRuleSetMetric"
            }
        },
        {
            "Name": "AWSManagedRulesKnownBadInputsRuleSet",
            "Priority": 2,
            "OverrideAction": {
                "None": {}
            },
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesKnownBadInputsRuleSet"
                }
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "KnownBadInputsMetric"
            }
        },
        {
            "Name": "AWSManagedRulesAmazonIpReputationList",
            "Priority": 3,
            "OverrideAction": {
                "None": {}
            },
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesAmazonIpReputationList"
                }
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "IpReputationMetric"
            }
        },
        {
            "Name": "RateLimitRule",
            "Priority": 4,
            "Action": {
                "Block": {}
            },
            "Statement": {
                "RateBasedStatement": {
                    "Limit": 2000,
                    "AggregateKeyType": "IP"
                }
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "RateLimitMetric"
            }
        },
        {
            "Name": "SQLInjectionRule",
            "Priority": 5,
            "OverrideAction": {
                "None": {}
            },
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesSQLiRuleSet"
                }
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "SQLInjectionMetric"
            }
        }
    ],
    "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "LaburemosWebACLMetric"
    },
    "Tags": [
        {
            "Key": "Environment",
            "Value": "Production"
        },
        {
            "Key": "Project",
            "Value": "LABUREMOS"
        }
    ]
}
EOF

# Crear Web ACL
WAF_ARN=$(aws wafv2 create-web-acl \
    --name "${WAF_NAME}" \
    --scope CLOUDFRONT \
    --default-action Allow={} \
    --description "Web ACL para protección de LABUREMOS" \
    --rules file://web-acl-rules.json \
    --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=LaburemosWebACLMetric \
    --region "$REGION" \
    --query 'Summary.ARN' \
    --output text 2>/dev/null || echo "Obteniendo ARN existente...")

# Si no se pudo crear (porque ya existe), obtener el ARN
if [[ "$WAF_ARN" == "Obteniendo ARN existente..." ]]; then
    WAF_ARN=$(aws wafv2 list-web-acls --scope CLOUDFRONT --region "$REGION" --query "WebACLs[?Name=='${WAF_NAME}'].ARN" --output text)
fi

echo -e "${GREEN}✅ Web ACL ARN: ${WAF_ARN}${NC}"

# 3. Crear archivo de reglas separado (más legible)
cat > web-acl-rules.json << EOF
[
    {
        "Name": "AWSManagedRulesCommonRuleSet",
        "Priority": 1,
        "OverrideAction": {
            "None": {}
        },
        "Statement": {
            "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesCommonRuleSet"
            }
        },
        "VisibilityConfig": {
            "SampledRequestsEnabled": true,
            "CloudWatchMetricsEnabled": true,
            "MetricName": "CommonRuleSetMetric"
        }
    },
    {
        "Name": "RateLimitRule",
        "Priority": 10,
        "Action": {
            "Block": {}
        },
        "Statement": {
            "RateBasedStatement": {
                "Limit": 2000,
                "AggregateKeyType": "IP"
            }
        },
        "VisibilityConfig": {
            "SampledRequestsEnabled": true,
            "CloudWatchMetricsEnabled": true,
            "MetricName": "RateLimitMetric"
        }
    }
]
EOF

# 4. Asociar Web ACL con CloudFront Distribution
echo -e "${GREEN}✅ Asociando Web ACL con CloudFront Distribution...${NC}"

# Obtener configuración actual de CloudFront
aws cloudfront get-distribution-config \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --query 'DistributionConfig' \
    --output json > current-cf-config.json

# Agregar WebACLId a la configuración
jq --arg waf_arn "$WAF_ARN" '.WebACLId = $waf_arn' current-cf-config.json > updated-cf-config.json

# Obtener ETag actual
ETAG=$(aws cloudfront get-distribution-config --id "$CLOUDFRONT_DISTRIBUTION_ID" --query 'ETag' --output text)

# Actualizar CloudFront con Web ACL
aws cloudfront update-distribution \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --distribution-config file://updated-cf-config.json \
    --if-match "$ETAG" || echo "Error actualizando CloudFront - puede que ya esté configurado"

# 5. Crear CloudWatch Dashboard para monitoreo
echo -e "${GREEN}✅ Creando CloudWatch Dashboard...${NC}"
cat > waf-dashboard.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/WAFV2", "AllowedRequests", "WebACL", "${WAF_NAME}", "Region", "CloudFront", "Rule", "ALL" ],
                    [ ".", "BlockedRequests", ".", ".", ".", ".", ".", "." ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "LABUREMOS WAF - Requests Overview"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/WAFV2", "BlockedRequests", "WebACL", "${WAF_NAME}", "Region", "CloudFront", "Rule", "RateLimitRule" ]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "Rate Limited Requests"
            }
        }
    ]
}
EOF

aws cloudwatch put-dashboard \
    --dashboard-name "LABUREMOS-WAF-Security" \
    --dashboard-body file://waf-dashboard.json \
    --region "$REGION"

# 6. Crear alarmas de CloudWatch
echo -e "${GREEN}✅ Creando alarmas de seguridad...${NC}"

# Alarma para muchas requests bloqueadas
aws cloudwatch put-metric-alarm \
    --alarm-name "LABUREMOS-WAF-HighBlockedRequests" \
    --alarm-description "Muchas requests bloqueadas por WAF" \
    --metric-name BlockedRequests \
    --namespace AWS/WAFV2 \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 100 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=WebACL,Value="${WAF_NAME}" Name=Region,Value=CloudFront \
    --region "$REGION"

# Alarma para rate limiting
aws cloudwatch put-metric-alarm \
    --alarm-name "LABUREMOS-WAF-RateLimiting" \
    --alarm-description "Rate limiting activado" \
    --metric-name BlockedRequests \
    --namespace AWS/WAFV2 \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=WebACL,Value="${WAF_NAME}" Name=Region,Value=CloudFront Name=Rule,Value=RateLimitRule \
    --region "$REGION"

# Limpiar archivos temporales
rm -f web-acl.json web-acl-rules.json trusted-ips.json current-cf-config.json updated-cf-config.json waf-dashboard.json

echo -e "${GREEN}✅ AWS WAF configurado exitosamente${NC}"
echo -e "${YELLOW}📊 Dashboard disponible en:${NC}"
echo "https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=LABUREMOS-WAF-Security"

echo -e "${YELLOW}📝 WAF Web ACL ARN:${NC}"
echo "$WAF_ARN"

echo -e "${BLUE}🔍 Para verificar el estado:${NC}"
echo "aws wafv2 get-web-acl --scope CLOUDFRONT --id \$(echo $WAF_ARN | cut -d'/' -f4) --region $REGION"

echo -e "${YELLOW}⚠️  Nota: Los cambios en CloudFront pueden tardar hasta 15 minutos en propagarse${NC}"