#!/bin/bash

# LABUREMOS CloudFront WAF Setup
# Configuración automática de Web Application Firewall
# Versión: 1.0
# Fecha: 2025-08-01

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛡️ LABUREMOS - CloudFront WAF Setup${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Variables de configuración
CLOUDFRONT_DISTRIBUTION_ID="E1E1QZ7YLALIAZ"
WAF_NAME="laburemos-protection-waf"
REGION="us-east-1"
LOG_FILE="/mnt/d/Laburar/waf-setup.log"

# Función para logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo -e "$1"
}

# Función para verificar AWS CLI
check_aws_cli() {
    log "${BLUE}1. Verificando configuración AWS CLI...${NC}"
    
    if ! command -v aws &> /dev/null; then
        log "${RED}❌ AWS CLI no está instalado${NC}"
        exit 1
    fi
    
    # Verificar credenciales
    if ! aws sts get-caller-identity &> /dev/null; then
        log "${RED}❌ AWS CLI no está configurado correctamente${NC}"
        log "   Ejecutar: aws configure"
        exit 1
    fi
    
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    log "${GREEN}✅ AWS CLI configurado correctamente (Account: $AWS_ACCOUNT)${NC}"
}

# Función para crear Web ACL
create_web_acl() {
    log "${BLUE}2. Creando Web ACL para WAF...${NC}"
    
    # Verificar si ya existe
    EXISTING_ACL=$(aws wafv2 list-web-acls --scope CLOUDFRONT --region us-east-1 --query "WebACLs[?Name=='$WAF_NAME'].Id" --output text 2>/dev/null || echo "")
    
    if [ ! -z "$EXISTING_ACL" ]; then
        log "${YELLOW}⚠️  Web ACL '$WAF_NAME' ya existe (ID: $EXISTING_ACL)${NC}"
        WEB_ACL_ID="$EXISTING_ACL"
        return 0
    fi
    
    # Crear archivo temporal de configuración
    cat > "/tmp/waf-rules.json" << 'EOF'
{
  "Name": "laburemos-protection-waf",
  "Scope": "CLOUDFRONT",
  "DefaultAction": {
    "Allow": {}
  },
  "Rules": [
    {
      "Name": "AWSManagedRulesCommonRuleSet",
      "Priority": 1,
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet",
          "ExcludedRules": []
        }
      },
      "OverrideAction": {
        "None": {}
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
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesKnownBadInputsRuleSet",
          "ExcludedRules": []
        }
      },
      "OverrideAction": {
        "None": {}
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
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesAmazonIpReputationList",
          "ExcludedRules": []
        }
      },
      "OverrideAction": {
        "None": {}
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
      "Statement": {
        "RateBasedStatement": {
          "Limit": 2000,
          "AggregateKeyType": "IP"
        }
      },
      "Action": {
        "Block": {}
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "RateLimitMetric"
      }
    }
  ],
  "VisibilityConfig": {
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "LaburemosWAFMetric"
  }
}
EOF
    
    # Crear Web ACL
    log "   Creando Web ACL con reglas de seguridad..."
    CREATE_RESULT=$(aws wafv2 create-web-acl \
        --region us-east-1 \
        --cli-input-json file:///tmp/waf-rules.json \
        --query 'Summary.{Id:Id,ARN:ARN}' \
        --output json)
    
    WEB_ACL_ID=$(echo "$CREATE_RESULT" | jq -r '.Id')
    WEB_ACL_ARN=$(echo "$CREATE_RESULT" | jq -r '.ARN')
    
    log "${GREEN}✅ Web ACL creado exitosamente${NC}"
    log "   ID: $WEB_ACL_ID"
    log "   ARN: $WEB_ACL_ARN"
    
    # Limpiar archivo temporal
    rm -f "/tmp/waf-rules.json"
}

# Función para asociar WAF con CloudFront
associate_waf_cloudfront() {
    log "${BLUE}3. Asociando WAF con CloudFront...${NC}"
    
    # Obtener configuración actual de CloudFront
    log "   Obteniendo configuración actual de CloudFront..."
    DISTRIBUTION_CONFIG=$(aws cloudfront get-distribution-config \
        --id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --query 'DistributionConfig' \
        --output json)
    
    ETAG=$(aws cloudfront get-distribution-config \
        --id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --query 'ETag' \
        --output text)
    
    # Crear configuración actualizada
    UPDATED_CONFIG=$(echo "$DISTRIBUTION_CONFIG" | jq --arg acl_arn "$WEB_ACL_ARN" '.WebACLId = $acl_arn')
    
    # Guardar configuración temporalmente
    echo "$UPDATED_CONFIG" > "/tmp/cloudfront-config.json"
    
    # Actualizar distribución
    log "   Aplicando configuración WAF a CloudFront..."
    aws cloudfront update-distribution \
        --id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --distribution-config file:///tmp/cloudfront-config.json \
        --if-match "$ETAG" \
        --output table
    
    log "${GREEN}✅ WAF asociado con CloudFront exitosamente${NC}"
    log "   La propagación puede tomar 15-20 minutos"
    
    # Limpiar archivo temporal
    rm -f "/tmp/cloudfront-config.json"
}

# Función para configurar logging de WAF
setup_waf_logging() {
    log "${BLUE}4. Configurando logging de WAF...${NC}"
    
    # Crear S3 bucket para logs (si no existe)
    S3_BUCKET="aws-waf-logs-laburemos-$(date +%Y%m%d)"
    
    if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
        log "   Creando bucket S3 para logs WAF..."
        aws s3 mb "s3://$S3_BUCKET" --region us-east-1
        
        # Configurar política del bucket
        cat > "/tmp/s3-policy.json" << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AWSLogDeliveryWrite",
            "Effect": "Allow",
            "Principal": {
                "Service": "delivery.logs.amazonaws.com"
            },
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::$S3_BUCKET/AWSLogs/*"
        },
        {
            "Sid": "AWSLogDeliveryAclCheck",
            "Effect": "Allow",
            "Principal": {
                "Service": "delivery.logs.amazonaws.com"
            },
            "Action": "s3:GetBucketAcl",
            "Resource": "arn:aws:s3:::$S3_BUCKET"
        }
    ]
}
EOF
        
        aws s3api put-bucket-policy \
            --bucket "$S3_BUCKET" \
            --policy file:///tmp/s3-policy.json
        
        rm -f "/tmp/s3-policy.json"
        
        log "${GREEN}✅ Bucket S3 creado para logs: $S3_BUCKET${NC}"
    else
        log "${YELLOW}⚠️  Bucket S3 ya existe: $S3_BUCKET${NC}"
    fi
    
    # Configurar logging de WAF
    log "   Configurando logging de WAF..."
    aws wafv2 put-logging-configuration \
        --region us-east-1 \
        --logging-configuration "ResourceArn=$WEB_ACL_ARN,LogDestinationConfigs=[\"arn:aws:s3:::$S3_BUCKET/waf-logs/\"],RedactedFields=[]" \
        --output table
    
    log "${GREEN}✅ Logging de WAF configurado${NC}"
}

# Función para crear alertas de CloudWatch
setup_cloudwatch_alerts() {
    log "${BLUE}5. Configurando alertas de CloudWatch...${NC}"
    
    # Alerta para requests bloqueados
    aws cloudwatch put-metric-alarm \
        --alarm-name "LaburemosBlocekdRequests" \
        --alarm-description "High number of blocked requests by WAF" \
        --metric-name "BlockedRequests" \
        --namespace "AWS/WAFV2" \
        --statistic "Sum" \
        --period 300 \
        --evaluation-periods 3 \
        --threshold 100 \
        --comparison-operator "GreaterThanThreshold" \
        --dimensions Name=WebACL,Value="$WAF_NAME" Name=Region,Value="CloudFront" \
        --treat-missing-data "notBreaching"
    
    # Alerta para rate limit violations
    aws cloudwatch put-metric-alarm \
        --alarm-name "LaburemosRateLimitViolations" \
        --alarm-description "High rate limit violations detected" \
        --metric-name "RateLimitMetric" \
        --namespace "AWS/WAFV2" \
        --statistic "Sum" \
        --period 300 \
        --evaluation-periods 2 \
        --threshold 50 \
        --comparison-operator "GreaterThanThreshold" \
        --dimensions Name=WebACL,Value="$WAF_NAME" Name=Region,Value="CloudFront" \
        --treat-missing-data "notBreaching"
    
    log "${GREEN}✅ Alertas de CloudWatch configuradas${NC}"
}

# Función para testing inicial
test_waf_protection() {
    log "${BLUE}6. Realizando testing inicial de WAF...${NC}"
    
    log "   Esperando 30 segundos para propagación inicial..."
    sleep 30
    
    # Test básico de acceso normal
    log "   Testeando acceso normal..."
    NORMAL_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "https://laburemos.com.ar" || echo "000")
    
    if [ "$NORMAL_RESPONSE" = "200" ]; then
        log "${GREEN}✅ Acceso normal funciona correctamente${NC}"
    else
        log "${YELLOW}⚠️  Respuesta inesperada: $NORMAL_RESPONSE${NC}"
    fi
    
    # Test de payload malicioso básico
    log "   Testeando protección contra payloads maliciosos..."
    MALICIOUS_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "https://laburemos.com.ar/?test=<script>alert('xss')</script>" || echo "000")
    
    if [ "$MALICIOUS_RESPONSE" = "403" ]; then
        log "${GREEN}✅ WAF bloqueando payloads maliciosos correctamente${NC}"
    else
        log "${YELLOW}⚠️  WAF puede no estar bloqueando aún (propagación en curso)${NC}"
        log "   Respuesta: $MALICIOUS_RESPONSE"
    fi
}

# Función para generar reporte de configuración
generate_waf_report() {
    log "${BLUE}7. Generando reporte de configuración WAF...${NC}"
    
    REPORT_FILE="/mnt/d/Laburar/waf-configuration-report.json"
    
    cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project": "LABUREMOS",
  "waf_configuration": {
    "web_acl_id": "$WEB_ACL_ID",
    "web_acl_arn": "$WEB_ACL_ARN",
    "cloudfront_distribution": "$CLOUDFRONT_DISTRIBUTION_ID",
    "status": "configured",
    "rules": [
      {
        "name": "AWSManagedRulesCommonRuleSet",
        "priority": 1,
        "description": "Common web vulnerabilities protection"
      },
      {
        "name": "AWSManagedRulesKnownBadInputsRuleSet", 
        "priority": 2,
        "description": "Known malicious inputs protection"
      },
      {
        "name": "AWSManagedRulesAmazonIpReputationList",
        "priority": 3,
        "description": "IP reputation based blocking"
      },
      {
        "name": "RateLimitRule",
        "priority": 4,
        "description": "Rate limiting (2000 req/5min per IP)"
      }
    ],
    "logging": {
      "enabled": true,
      "s3_bucket": "$S3_BUCKET",
      "log_destination": "arn:aws:s3:::$S3_BUCKET/waf-logs/"
    },
    "monitoring": {
      "cloudwatch_metrics": true,
      "alarms_configured": 2,
      "alarm_names": [
        "LaburemosBlocekdRequests",
        "LaburemosRateLimitViolations"
      ]
    }
  },
  "security_improvements": {
    "ddos_protection": "Enhanced via WAF + CloudFront",
    "injection_attacks": "Blocked by Common Rule Set",
    "malicious_ips": "Blocked by IP Reputation List",
    "rate_limiting": "2000 requests per 5 minutes per IP",
    "visibility": "Full logging and monitoring enabled"
  },
  "estimated_costs": {
    "waf_requests": "$0.60 per million requests",
    "waf_rules": "$2.00 per rule per month", 
    "cloudwatch_metrics": "$0.30 per metric per month",
    "s3_logging": "$0.023 per GB stored",
    "estimated_monthly": "$15-30 USD"
  },
  "next_steps": [
    "Monitor WAF metrics in CloudWatch",
    "Review blocked requests in logs",
    "Fine-tune rules based on traffic patterns",
    "Set up SNS notifications for critical alerts"
  ]
}
EOF
    
    log "${GREEN}✅ Reporte WAF generado: $REPORT_FILE${NC}"
}

# Función para mostrar resumen final
show_summary() {
    log "${BLUE}8. Resumen de configuración WAF...${NC}"
    echo ""
    
    log "${GREEN}✅ WAF CONFIGURADO EXITOSAMENTE:${NC}"
    log "   • Web ACL creado con 4 reglas de protección"
    log "   • Asociado con CloudFront distribution"
    log "   • Logging configurado en S3"
    log "   • Alertas de CloudWatch activas"
    log "   • Testing inicial completado"
    echo ""
    
    log "${BLUE}🛡️ PROTECCIONES HABILITADAS:${NC}"
    log "   • Common web vulnerabilities (OWASP)"
    log "   • Known malicious inputs"
    log "   • IP reputation filtering"
    log "   • Rate limiting (2000 req/5min per IP)"
    log "   • DDoS protection (CloudFront + WAF)"
    echo ""
    
    log "${YELLOW}⚠️  IMPORTANTE:${NC}"
    log "   • Propagación completa: 15-20 minutos"
    log "   • Monitorear métricas en CloudWatch"
    log "   • Costo estimado: $15-30/mes adicionales"
    echo ""
    
    log "${BLUE}📊 MONITOREO:${NC}"
    log "   • CloudWatch: https://console.aws.amazon.com/cloudwatch/"
    log "   • WAF Console: https://console.aws.amazon.com/wafv2/"
    log "   • Logs S3: s3://$S3_BUCKET/waf-logs/"
}

# Función principal
main() {
    log "${BLUE}Iniciando configuración WAF para LABUREMOS...${NC}"
    echo ""
    
    check_aws_cli
    create_web_acl
    associate_waf_cloudfront
    setup_waf_logging
    setup_cloudwatch_alerts
    test_waf_protection
    generate_waf_report
    show_summary
    
    log "${GREEN}🎉 Configuración WAF completada exitosamente!${NC}"
    log "📋 Log completo guardado en: $LOG_FILE"
}

# Verificar si jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq no está instalado. Instalar con: sudo apt-get install jq${NC}"
    exit 1
fi

# Ejecutar script principal
main "$@"