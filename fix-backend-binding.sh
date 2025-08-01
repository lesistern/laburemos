#!/bin/bash

# Script para corregir el binding de los servicios backend

echo "🔧 Configurando servicios para acceso externo..."
echo ""

SSH_KEY="$HOME/laburemos-key.pem"
EC2_IP="3.81.56.168"
EC2_USER="ec2-user"

# Comandos para configurar servicios
COMMANDS="
echo '=== Parando servicios actuales ==='
pm2 stop all
pm2 delete all

echo ''
echo '=== Configurando servicios para acceso externo ==='
cd /home/ec2-user/laburemos/backend

# Crear archivos de configuración PM2
cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [
    {
      name: 'backend-3001',
      script: 'npm',
      args: 'run start:prod',
      env: {
        PORT: 3001,
        HOST: '0.0.0.0',
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      restart_delay: 1000
    },
    {
      name: 'backend-3002',
      script: 'npm',
      args: 'run start:dev',
      env: {
        PORT: 3002,
        HOST: '0.0.0.0',
        NODE_ENV: 'development'
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      restart_delay: 2000
    }
  ]
};
EOFPM2

echo 'Archivo ecosystem.config.js creado'

# Iniciar servicios con la nueva configuración
echo ''
echo '=== Iniciando servicios con configuración externa ==='
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

echo ''
echo '=== Estado de servicios ==='
pm2 list

echo ''
echo '=== Verificando binding interno ==='
sleep 5
curl -I http://localhost:3001 --max-time 5 2>/dev/null && echo 'Puerto 3001: OK interno' || echo 'Puerto 3001: ERROR interno'
curl -I http://localhost:3002 --max-time 5 2>/dev/null && echo 'Puerto 3002: OK interno' || echo 'Puerto 3002: ERROR interno'

echo ''
echo '=== Verificando puertos abiertos ==='
netstat -tulpn | grep ':300[12]' || ss -tulpn | grep ':300[12]' || echo 'Comandos netstat/ss no disponibles'
"

# Ejecutar comandos
ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "$COMMANDS"

echo ""
echo "🔍 Verificando acceso externo..."
sleep 10

# Verificar desde el exterior
echo "Puerto 3001:"
curl -I http://$EC2_IP:3001 --max-time 10 2>&1 | head -3

echo ""
echo "Puerto 3002:"
curl -I http://$EC2_IP:3002 --max-time 10 2>&1 | head -3