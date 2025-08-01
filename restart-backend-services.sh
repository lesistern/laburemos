#!/bin/bash

# Script para reiniciar servicios backend en EC2 automáticamente

echo "🔧 Reiniciando servicios backend en EC2..."
echo ""

# Usar la llave SSH correcta
SSH_KEY="$HOME/laburemos-key.pem"
EC2_IP="3.81.56.168"
EC2_USER="ec2-user"

# Configurar permisos de la llave
chmod 400 "$SSH_KEY"

echo "Conectando a EC2 ($EC2_IP)..."

# Comandos a ejecutar en el servidor
COMMANDS="
echo '=== Estado actual de servicios ==='
pm2 list || echo 'PM2 no está ejecutándose'

echo ''
echo '=== Reiniciando servicios ==='
pm2 restart all || {
    echo 'PM2 no encontrado, iniciando servicios manualmente...'
    
    # Buscar directorios de backend
    if [ -d '/home/ec2-user/backend' ]; then
        cd /home/ec2-user/backend
        echo 'Iniciando servicios desde /home/ec2-user/backend'
    elif [ -d '/home/ec2-user/laburemos/backend' ]; then
        cd /home/ec2-user/laburemos/backend
        echo 'Iniciando servicios desde /home/ec2-user/laburemos/backend'
    elif [ -d '/opt/backend' ]; then
        cd /opt/backend
        echo 'Iniciando servicios desde /opt/backend'
    else
        echo 'No se encontró el directorio del backend'
        find /home/ec2-user -name 'package.json' -type f 2>/dev/null | head -5
        exit 1
    fi
    
    # Instalar PM2 si no existe
    npm install -g pm2 2>/dev/null || echo 'No se pudo instalar PM2'
    
    # Iniciar servicios
    pm2 start npm --name 'backend-3001' -- run start:prod 2>/dev/null || {
        echo 'Intentando con node directamente...'
        node dist/main.js --port 3001 &
        echo 'Servicio en puerto 3001 iniciado'
    }
    
    pm2 start npm --name 'backend-3002' -- run start:dev 2>/dev/null || {
        echo 'Intentando con node directamente en puerto 3002...'
        PORT=3002 node dist/main.js &
        echo 'Servicio en puerto 3002 iniciado'
    }
    
    pm2 save 2>/dev/null
    pm2 startup 2>/dev/null
}

echo ''
echo '=== Estado final de servicios ==='
pm2 list || ps aux | grep node

echo ''
echo '=== Verificando puertos ==='
netstat -tulpn | grep ':300[12]' || ss -tulpn | grep ':300[12]'

echo ''
echo '=== Prueba de conectividad ==='
curl -I http://localhost:3001 --max-time 5 2>/dev/null && echo 'Puerto 3001: OK' || echo 'Puerto 3001: ERROR'
curl -I http://localhost:3002 --max-time 5 2>/dev/null && echo 'Puerto 3002: OK' || echo 'Puerto 3002: ERROR'
"

# Ejecutar comandos en el servidor
ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "$COMMANDS"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Comandos ejecutados exitosamente"
    echo ""
    echo "🔍 Verificando desde el exterior..."
    
    # Esperar un momento para que los servicios arranquen
    sleep 5
    
    # Verificar puertos desde el exterior
    echo "Puerto 3001:"
    curl -I http://$EC2_IP:3001 --max-time 10 2>&1 | head -5
    
    echo ""
    echo "Puerto 3002:"
    curl -I http://$EC2_IP:3002 --max-time 10 2>&1 | head -5
    
else
    echo ""
    echo "❌ Error conectando a EC2"
    echo "Verifique:"
    echo "1. La llave SSH esté en: $SSH_KEY"
    echo "2. La instancia EC2 esté ejecutándose"
    echo "3. Los Security Groups permitan SSH (puerto 22)"
fi