#!/bin/bash

# Script para monitorear el reinicio de EC2 y verificar servicios

echo "🔄 Monitoreando reinicio de EC2 i-014e7a8e24ac2290d..."
echo ""

EC2_IP="3.81.56.168"
INSTANCE_ID="i-014e7a8e24ac2290d"

# Función para verificar estado de la instancia
check_instance_status() {
    ./aws/dist/aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --query 'Reservations[0].Instances[0].State.Name' \
        --output text 2>/dev/null
}

# Función para verificar servicios HTTP
check_http_services() {
    local port=$1
    curl -s -o /dev/null -w "%{http_code}" http://$EC2_IP:$port --max-time 5 2>/dev/null
}

echo "Estado inicial de la instancia:"
INITIAL_STATUS=$(check_instance_status)
echo "Estado: $INITIAL_STATUS"
echo ""

# Esperar a que la instancia esté ejecutándose
echo "Esperando a que la instancia esté ejecutándose..."
WAIT_COUNT=0
MAX_WAIT=20  # 20 intentos = 10 minutos máximo

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    STATUS=$(check_instance_status)
    echo "$(date +%H:%M:%S) - Estado: $STATUS"
    
    if [ "$STATUS" = "running" ]; then
        echo "✅ Instancia ejecutándose"
        break
    fi
    
    WAIT_COUNT=$((WAIT_COUNT + 1))
    sleep 30
done

if [ "$STATUS" != "running" ]; then
    echo "❌ La instancia no se inició en el tiempo esperado"
    exit 1
fi

# Esperar un poco más para que los servicios arranquen
echo ""
echo "Esperando 60 segundos para que los servicios arranquen..."
sleep 60

# Verificar servicios
echo ""
echo "🔍 Verificando servicios backend:"
echo "================================="

# Puerto 3001
echo -n "Puerto 3001: "
HTTP_CODE_3001=$(check_http_services 3001)
if [ "$HTTP_CODE_3001" = "200" ] || [ "$HTTP_CODE_3001" = "404" ] || [ "$HTTP_CODE_3001" = "302" ]; then
    echo "✅ ACTIVO (HTTP $HTTP_CODE_3001)"
else
    echo "❌ NO RESPONDE (HTTP $HTTP_CODE_3001)"
fi

# Puerto 3002
echo -n "Puerto 3002: "
HTTP_CODE_3002=$(check_http_services 3002)
if [ "$HTTP_CODE_3002" = "200" ] || [ "$HTTP_CODE_3002" = "404" ] || [ "$HTTP_CODE_3002" = "302" ]; then
    echo "✅ ACTIVO (HTTP $HTTP_CODE_3002)"
else
    echo "❌ NO RESPONDE (HTTP $HTTP_CODE_3002)"
fi

echo ""

# Si los servicios no responden, intentar reiniciarlos
if [ "$HTTP_CODE_3001" = "000" ] && [ "$HTTP_CODE_3002" = "000" ]; then
    echo "⚠️  Los servicios no responden, intentando reiniciarlos..."
    echo "Ejecutando script de reinicio de servicios..."
    ./restart-backend-services.sh
else
    echo "🎉 ¡Al menos un servicio está funcionando!"
fi

echo ""
echo "=== RESUMEN ==="
echo "Instancia EC2: $STATUS"
echo "Backend 3001: $([ "$HTTP_CODE_3001" != "000" ] && echo "ACTIVO" || echo "INACTIVO")"
echo "Backend 3002: $([ "$HTTP_CODE_3002" != "000" ] && echo "ACTIVO" || echo "INACTIVO")"
echo ""

# URLs de prueba
echo "🌐 URLs para probar:"
echo "Frontend: https://d2ijlktcsmmfsd.cloudfront.net"
echo "Backend API: http://$EC2_IP:3001"
echo "NestJS API: http://$EC2_IP:3002"