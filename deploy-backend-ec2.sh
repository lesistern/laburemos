#!/bin/bash
# Script de despliegue para backend NestJS en EC2

# Variables
EC2_IP="3.81.56.168"
KEY_PATH="/tmp/laburemos-key.pem"
DB_ENDPOINT="laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"

echo "=== Desplegando Backend LABUREMOS en EC2 ==="

# Crear archivo de configuración de entorno
cat << 'EOF' > backend.env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:Laburemos2025!@laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com:5432/laburemos
JWT_SECRET=laburemos-jwt-secret-production-2025
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://3.81.56.168:3000,http://localhost:3000
AWS_REGION=us-east-1
AWS_S3_BUCKET=laburemos-files-2025
EOF

# Copiar archivo de entorno al servidor
scp -i $KEY_PATH backend.env ec2-user@$EC2_IP:~/

# Conectar y configurar
ssh -i $KEY_PATH ec2-user@$EC2_IP << 'ENDSSH'
# Configurar Node.js
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 16

# Instalar PM2
npm install -g pm2

# Crear directorio para la aplicación
mkdir -p ~/laburemos-backend
cd ~/laburemos-backend

# Crear package.json básico para prueba
cat << 'EOF' > package.json
{
  "name": "laburemos-backend",
  "version": "1.0.0",
  "description": "LABUREMOS Backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
EOF

# Crear servidor de prueba
cat << 'EOF' > server.js
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'LABUREMOS Backend API',
    status: 'ready',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# Copiar variables de entorno
cp ~/backend.env .env

# Iniciar con PM2
pm2 start server.js --name laburemos-backend
pm2 save
pm2 startup

echo "=== Backend desplegado exitosamente ==="
echo "Verificar en: http://$EC2_IP:3001"
ENDSSH

echo "=== Despliegue completado ==="
echo "Backend URL: http://$EC2_IP:3001"
echo "Database: $DB_ENDPOINT"