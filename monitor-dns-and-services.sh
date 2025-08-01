#!/bin/bash

# Script para monitorear DNS, SSL y servicios backend

echo "🔍 Monitoreando progreso completo de laburemos.com.ar..."
echo "======================================================="
echo ""

# 1. Verificar propagación DNS
echo "1. 🌐 VERIFICANDO PROPAGACIÓN DNS"
echo "--------------------------------"

# Verificar resolución DNS local
echo -n "DNS Local: "
if python3 -c "import socket; print(socket.gethostbyname('laburemos.com.ar'))" 2>/dev/null; then
    echo "✅ RESUELVE"
else
    echo "❌ NO RESUELVE (normal, puede tomar 2-48h)"
fi

echo -n "DNS WWW: "
if python3 -c "import socket; print(socket.gethostbyname('www.laburemos.com.ar'))" 2>/dev/null; then
    echo "✅ RESUELVE"
else
    echo "❌ NO RESUELVE (normal, puede tomar 2-48h)"
fi

# 2. Verificar certificado SSL
echo ""
echo "2. 🔒 VERIFICANDO CERTIFICADO SSL"
echo "--------------------------------"
SSL_STATUS=$(./aws/dist/aws acm describe-certificate \
    --certificate-arn arn:aws:acm:us-east-1:529496937346:certificate/94aa65d0-875b-4556-ae27-0c1f49f0b886 \
    --query 'Certificate.Status' \
    --output text 2>/dev/null)

echo "Estado SSL: $SSL_STATUS"

if [ "$SSL_STATUS" = "ISSUED" ]; then
    echo "✅ CERTIFICADO VÁLIDO - LISTO PARA CLOUDFRONT"
elif [ "$SSL_STATUS" = "PENDING_VALIDATION" ]; then
    echo "⏳ VALIDÁNDOSE - Puede tomar 5-30 minutos más"
else
    echo "⚠️  Estado: $SSL_STATUS"
fi

# 3. Verificar servicios backend
echo ""
echo "3. 🔧 VERIFICANDO SERVICIOS BACKEND"
echo "-----------------------------------"

EC2_IP="3.81.56.168"

# Puerto 3001
echo -n "Backend 3001: "
HTTP_CODE_3001=$(curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP:3001 --max-time 5 2>/dev/null)
if [ "$HTTP_CODE_3001" = "200" ] || [ "$HTTP_CODE_3001" = "404" ] || [ "$HTTP_CODE_3001" = "302" ]; then
    echo "✅ ACTIVO (HTTP $HTTP_CODE_3001)"
else
    echo "❌ NO RESPONDE (HTTP $HTTP_CODE_3001)"
fi

# Puerto 3002
echo -n "Backend 3002: "
HTTP_CODE_3002=$(curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP:3002 --max-time 5 2>/dev/null)
if [ "$HTTP_CODE_3002" = "200" ] || [ "$HTTP_CODE_3002" = "404" ] || [ "$HTTP_CODE_3002" = "302" ]; then
    echo "✅ ACTIVO (HTTP $HTTP_CODE_3002)"
else
    echo "❌ NO RESPONDE (HTTP $HTTP_CODE_3002)"
fi

# 4. Verificar CloudFront
echo ""
echo "4. ☁️ VERIFICANDO CLOUDFRONT"
echo "-----------------------------"
echo -n "CloudFront CDN: "
CF_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://d2ijlktcsmmfsd.cloudfront.net --max-time 10 2>/dev/null)
if [ "$CF_CODE" = "200" ] || [ "$CF_CODE" = "404" ] || [ "$CF_CODE" = "302" ]; then
    echo "✅ ACTIVO (HTTP $CF_CODE)"
else
    echo "❌ PROBLEMA (HTTP $CF_CODE)"
fi

# 5. Estado de PM2 en EC2
echo ""
echo "5. 🔄 VERIFICANDO PM2 EN EC2"
echo "-----------------------------"

SSH_KEY="$HOME/laburemos-key.pem"
EC2_USER="ec2-user"

ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "pm2 list" 2>/dev/null || echo "❌ No se pudo conectar a EC2"

# Resumen de URLs
echo ""
echo "6. 🌐 URLS DE ACCESO ACTUALES"
echo "=============================="
echo "Frontend (Temporal): https://d2ijlktcsmmfsd.cloudfront.net"
echo "Backend 3001:        http://$EC2_IP:3001"
echo "Backend 3002:        http://$EC2_IP:3002"
echo ""
echo "Frontend (Final):    https://laburemos.com.ar (cuando DNS propague)"
echo "Frontend (WWW):      https://www.laburemos.com.ar (cuando DNS propague)"

# Próximos pasos
echo ""
echo "7. 📋 PRÓXIMOS PASOS"
echo "===================="

if [ "$SSL_STATUS" = "ISSUED" ]; then
    echo "✅ SSL listo - Ejecutar: ./update-cloudfront-domain.sh"
else
    echo "⏳ Esperar validación SSL (5-30 min)"
fi

if [ "$HTTP_CODE_3001" = "000" ] || [ "$HTTP_CODE_3002" = "000" ]; then
    echo "⚠️  Backends necesitan configuración - Verificar Redis/PostgreSQL"
else
    echo "✅ Backends funcionando correctamente"
fi

echo "⏳ Esperar propagación DNS completa (2-48 horas)"
echo "📊 Monitorear progreso con: ./monitor-dns-and-services.sh"

echo ""
echo "======================================================="
echo "Monitoreo completado - $(date)"