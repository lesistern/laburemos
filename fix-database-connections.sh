#!/bin/bash

# Script para verificar y configurar conexiones de base de datos

echo "🔧 Configurando conexiones de base de datos..."
echo ""

# Verificar estado de RDS
echo "1. Verificando estado de la instancia RDS..."
RDS_STATUS=$(./aws/dist/aws rds describe-db-instances \
    --db-instance-identifier laburemos-db \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text 2>/dev/null)

echo "Estado RDS: $RDS_STATUS"

if [ "$RDS_STATUS" != "available" ]; then
    echo "⚠️  La instancia RDS no está disponible. Iniciándola..."
    ./aws/dist/aws rds start-db-instance --db-instance-identifier laburemos-db
    echo "Esperando a que RDS esté disponible (esto puede tomar 5-10 minutos)..."
else
    echo "✅ RDS está disponible"
fi

# Verificar Security Groups de RDS
echo ""
echo "2. Verificando Security Groups de RDS..."
EC2_SG="sg-00099829a04cca633"
RDS_SG=$(./aws/dist/aws rds describe-db-instances \
    --db-instance-identifier laburemos-db \
    --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
    --output text 2>/dev/null)

echo "EC2 Security Group: $EC2_SG"
echo "RDS Security Group: $RDS_SG"

# Verificar si RDS permite conexiones desde EC2
if [ ! -z "$RDS_SG" ]; then
    echo "Verificando reglas de entrada en RDS Security Group..."
    POSTGRES_RULE=$(./aws/dist/aws ec2 describe-security-groups \
        --group-ids $RDS_SG \
        --query "SecurityGroups[0].IpPermissions[?FromPort==\`5432\`]" \
        --output text 2>/dev/null)
    
    if [ -z "$POSTGRES_RULE" ]; then
        echo "⚠️  Puerto 5432 no está abierto en RDS. Agregando regla..."
        ./aws/dist/aws ec2 authorize-security-group-ingress \
            --group-id $RDS_SG \
            --protocol tcp \
            --port 5432 \
            --source-group $EC2_SG \
            --group-rule-description "PostgreSQL access from EC2" 2>&1
    else
        echo "✅ Puerto 5432 está abierto en RDS"
    fi
fi

# Configurar Redis y servicios en EC2
echo ""
echo "3. Configurando Redis en EC2..."

SSH_KEY="$HOME/laburemos-key.pem"
EC2_IP="3.81.56.168"
EC2_USER="ec2-user"

COMMANDS="
echo '=== Instalando y configurando Redis ==='
# Instalar Redis si no está instalado
if ! command -v redis-server &> /dev/null; then
    echo 'Instalando Redis...'
    sudo yum update -y
    sudo amazon-linux-extras install redis6 -y
else
    echo 'Redis ya está instalado'
fi

# Iniciar Redis
echo 'Iniciando Redis...'
sudo systemctl start redis
sudo systemctl enable redis

# Verificar Redis
redis-cli ping || echo 'Redis no responde'

echo ''
echo '=== Configurando variables de entorno para backend ==='
cd /home/ec2-user/laburemos/backend

# Crear archivo .env si no existe
if [ ! -f .env ]; then
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
    echo 'Archivo .env creado'
else
    echo 'Archivo .env ya existe'
fi

echo ''
echo '=== Reiniciando servicios con nueva configuración ==='
pm2 stop all
pm2 delete all

# Crear configuración PM2 actualizada
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
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
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
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
};
EOFPM2

pm2 start ecosystem.config.js
pm2 save

echo ''
echo '=== Estado final ==='
pm2 list
sleep 10
pm2 logs --lines 5
"

# Ejecutar comandos en EC2
ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "$COMMANDS"

echo ""
echo "🔍 Verificando conectividad final..."
sleep 15

curl -I http://$EC2_IP:3001 --max-time 10 2>&1 | head -3
curl -I http://$EC2_IP:3002 --max-time 10 2>&1 | head -3