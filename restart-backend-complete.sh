#!/bin/bash

# Script completo para reiniciar backend desde cero

echo "🔧 Reiniciando backend completo en EC2..."
echo ""

SSH_KEY="$HOME/laburemos-key.pem"
EC2_IP="3.81.56.168"
EC2_USER="ec2-user"

COMMANDS="
echo '=== DIAGNÓSTICO INICIAL ==='
pwd
ls -la
echo ''

echo '=== VERIFICANDO ESTRUCTURA DEL PROYECTO ==='
ls -la /home/ec2-user/
echo ''

if [ -d '/home/ec2-user/laburemos' ]; then
    echo 'Directorio laburemos encontrado:'
    ls -la /home/ec2-user/laburemos/
    echo ''
    
    if [ -d '/home/ec2-user/laburemos/backend' ]; then
        echo 'Directorio backend encontrado:'
        ls -la /home/ec2-user/laburemos/backend/
        cd /home/ec2-user/laburemos/backend
    else
        echo '❌ No se encontró directorio backend'
        exit 1
    fi
else
    echo '❌ No se encontró directorio laburemos'
    echo 'Directorios disponibles:'
    ls -la /home/ec2-user/
    exit 1
fi

echo ''
echo '=== PM2 STATUS ACTUAL ==='
pm2 list
pm2 stop all 2>/dev/null || echo 'No hay procesos PM2 para detener'
pm2 delete all 2>/dev/null || echo 'No hay procesos PM2 para eliminar'

echo ''
echo '=== VERIFICANDO PACKAGE.JSON ==='
if [ -f 'package.json' ]; then
    echo 'package.json encontrado:'
    cat package.json | grep -A 10 -B 2 scripts || echo 'No se encontraron scripts'
else
    echo '❌ No se encontró package.json'
    exit 1
fi

echo ''
echo '=== VERIFICANDO NODE_MODULES ==='
if [ ! -d 'node_modules' ]; then
    echo 'Instalando dependencias...'
    npm install
else
    echo 'node_modules ya existe'
fi

echo ''
echo '=== CONFIGURANDO VARIABLES DE ENTORNO ==='
cat > .env << 'EOFENV'
# Database
DATABASE_URL=\"postgresql://postgres:laburemos2024@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos?schema=public\"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# JWT
JWT_SECRET=laburemos-jwt-secret-2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=laburemos-refresh-secret-2024
JWT_REFRESH_EXPIRES_IN=7d
EOFENV

echo 'Archivo .env creado:'
cat .env

echo ''
echo '=== VERIFICANDO REDIS ==='
redis-cli ping || (
    echo 'Redis no responde, instalando...'
    sudo yum update -y
    sudo amazon-linux-extras install redis6 -y
    sudo systemctl start redis
    sudo systemctl enable redis
    redis-cli ping
)

echo ''
echo '=== CREANDO CONFIGURACIÓN PM2 ==='
cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [
    {
      name: 'laburemos-backend',
      script: 'npm',
      args: 'start',
      env: {
        PORT: 3001,
        HOST: '0.0.0.0',
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};
EOFPM2

echo 'Configuración PM2 creada:'
cat ecosystem.config.js

echo ''
echo '=== CREANDO DIRECTORIO DE LOGS ==='
mkdir -p logs

echo ''
echo '=== COMPILANDO PROYECTO (SI ES NECESARIO) ==='
if grep -q 'build' package.json; then
    echo 'Compilando proyecto...'
    npm run build || echo 'Build falló, continuando...'
fi

echo ''
echo '=== INICIANDO CON PM2 ==='
pm2 start ecosystem.config.js
pm2 save

echo ''
echo '=== ESTADO FINAL ==='
pm2 list
pm2 logs laburemos-backend --lines 10 --nostream || echo 'No hay logs aún'

echo ''
echo '=== VERIFICANDO CONECTIVIDAD ==='
sleep 10
curl -I http://localhost:3001 --max-time 5 || echo 'No responde en localhost:3001'
curl -I http://0.0.0.0:3001 --max-time 5 || echo 'No responde en 0.0.0.0:3001'

echo ''
echo '=== INFORMACIÓN DE PUERTOS ==='
sudo netstat -tulpn | grep ':3001' || echo 'Puerto 3001 no está en uso'
"

# Ejecutar comandos en EC2
echo "Conectando a EC2 y ejecutando configuración completa..."
ssh -i "$SSH_KEY" -o ConnectTimeout=15 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "$COMMANDS"

echo ""
echo "🔍 Verificando resultado..."
sleep 5

# Verificar conectividad externa
curl -I http://$EC2_IP:3001 --max-time 10 2>&1 | head -3