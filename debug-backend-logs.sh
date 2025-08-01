#!/bin/bash

# Script para revisar logs y debugging de backend

echo "🔍 Debugging backend services..."
echo ""

SSH_KEY="$HOME/laburemos-key.pem"
EC2_IP="3.81.56.168"
EC2_USER="ec2-user"

# Comandos para debugging
COMMANDS="
echo '=== PM2 Status ==='
pm2 list

echo ''
echo '=== PM2 Logs (últimas 20 líneas) ==='
pm2 logs --lines 20

echo ''
echo '=== Verificar puertos en uso ==='
sudo netstat -tulpn | grep ':300[12]' || echo 'netstat no disponible'

echo ''
echo '=== Procesos Node.js ==='
ps aux | grep node

echo ''
echo '=== Variables de entorno ==='
pm2 env 0 2>/dev/null || echo 'No se pudo obtener env de PM2'

echo ''  
echo '=== Test interno simple ==='
curl -v http://localhost:3001 2>&1 | head -10 || echo 'curl localhost:3001 falló'
curl -v http://0.0.0.0:3001 2>&1 | head -10 || echo 'curl 0.0.0.0:3001 falló'

echo ''
echo '=== Verificar archivo de configuración ==='
cat ecosystem.config.js | head -20

echo ''
echo '=== Verificar package.json scripts ==='
cat package.json | grep -A 5 -B 5 scripts || echo 'No se encontró package.json'
"

# Ejecutar comandos
ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "$COMMANDS"