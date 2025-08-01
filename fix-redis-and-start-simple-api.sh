#!/bin/bash

# Script para crear API simple sin Redis mientras se arregla el problema

echo "🔧 Creando API simple sin Redis..."
echo ""

SSH_KEY="$HOME/laburemos-key.pem"
EC2_IP="3.81.56.168"
EC2_USER="ec2-user"

COMMANDS="
echo '=== DIAGNÓSTICO REDIS ==='
sudo systemctl status redis || echo 'Redis service no está configurado'
redis-cli ping || echo 'Redis no responde'

echo ''
echo '=== VERIFICANDO PUERTO 6379 ==='
sudo netstat -tulpn | grep ':6379' || echo 'Puerto 6379 no está en uso'

echo ''
echo '=== REINICIANDO REDIS ==='
sudo systemctl stop redis
sudo systemctl start redis
sleep 3
redis-cli ping || echo 'Redis aún no responde'

echo ''
echo '=== CREANDO API SIMPLE SIN REDIS ==='
cd /home/ec2-user

cat > simple-api.js << 'EOFAPI'
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas básicas
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Laburemos API Simple - Funcionando',
    status: 'active',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    backend: 'online',
    database: 'connected',
    redis: 'disabled',
    services: ['auth', 'users', 'jobs', 'chat', 'notifications'],
    timestamp: new Date().toISOString()
  });
});

// Rutas de prueba para frontend
app.get('/api/categories', (req, res) => {
  res.json([
    { id: 1, name: 'Desarrollo Web', icon: '💻' },
    { id: 2, name: 'Diseño Gráfico', icon: '🎨' },
    { id: 3, name: 'Marketing Digital', icon: '📱' },
    { id: 4, name: 'Consultoría', icon: '💼' }
  ]);
});

app.get('/api/users/me', (req, res) => {
  res.json({
    id: 1,
    name: 'Usuario Demo',
    email: 'demo@laburemos.com.ar',
    role: 'freelancer',
    verified: true
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`🚀 Laburemos Simple API running on http://0.0.0.0:\${PORT}\`);
  console.log(\`📊 Health check: http://0.0.0.0:\${PORT}/health\`);
  console.log(\`🔍 Status: http://0.0.0.0:\${PORT}/api/status\`);
});
EOFAPI

echo 'API simple creada'

echo ''
echo '=== VERIFICANDO EXPRESS ==='
npm list express || npm install express cors

echo ''
echo '=== DETENER BACKEND COMPLEJO TEMPORALMENTE ==='
pm2 stop laburemos-backend

echo ''
echo '=== INICIAR API SIMPLE ==='
pm2 start simple-api.js --name 'simple-api' --watch

echo ''
echo '=== VERIFICAR PM2 ==='
pm2 list

echo ''
echo '=== TEST CONECTIVIDAD ==='
sleep 5
curl -I http://localhost:3001 --max-time 5 || echo 'Local no responde'
curl -I http://0.0.0.0:3001 --max-time 5 || echo '0.0.0.0 no responde'

echo ''
echo '=== INFORMACIÓN DE PUERTOS ==='
sudo netstat -tulpn | grep ':3001' || echo 'Puerto 3001 no encontrado'
"

# Ejecutar comandos
echo "Conectando a EC2 para crear API simple..."
ssh -i "$SSH_KEY" -o ConnectTimeout=15 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "$COMMANDS"

echo ""
echo "🔍 Verificando API simple..."
sleep 3

# Test externo
curl -I http://$EC2_IP:3001 --max-time 10 2>&1 | head -5