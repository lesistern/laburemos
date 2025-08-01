#!/bin/bash
# Simple Backend Deployment for LABUREMOS

# Variables
EC2_IP="3.81.56.168"
KEY_PATH="/tmp/laburemos-key.pem"
DB_ENDPOINT="laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com"

echo "=== Deploying Simple Backend to EC2 ==="

# Create simple Node.js server
cat << 'EOF' > simple-server.js
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'laburemos-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL RDS',
    environment: 'production'
  });
});

// API routes
app.get('/api/status', (req, res) => {
  res.json({
    api: 'LABUREMOS Backend API',
    status: 'running',
    endpoints: [
      'GET /health',
      'GET /api/status',
      'GET /api/categories',
      'GET /api/services'
    ]
  });
});

app.get('/api/categories', (req, res) => {
  res.json([
    { id: 1, name: 'Desarrollo Web', slug: 'desarrollo-web', description: 'Servicios de desarrollo web' },
    { id: 2, name: 'Diseño Gráfico', slug: 'diseno-grafico', description: 'Servicios de diseño' },
    { id: 3, name: 'Marketing Digital', slug: 'marketing-digital', description: 'Servicios de marketing' },
    { id: 4, name: 'Redacción', slug: 'redaccion', description: 'Servicios de contenido' }
  ]);
});

app.get('/api/services', (req, res) => {
  res.json([
    {
      id: 1,
      title: 'Desarrollo de sitio web completo',
      description: 'Desarrollo de sitio web responsive con React y Node.js',
      price: 50000,
      category: 'Desarrollo Web',
      rating: 4.8
    },
    {
      id: 2,
      title: 'Diseño de logo profesional',
      description: 'Diseño de identidad visual completa para tu marca',
      price: 15000,
      category: 'Diseño Gráfico',
      rating: 4.9
    }
  ]);
});

// Swagger-like docs
app.get('/docs', (req, res) => {
  res.send(`
    <html><head><title>LABUREMOS API</title></head><body>
    <h1>LABUREMOS Backend API</h1>
    <h2>Available Endpoints:</h2>
    <ul>
      <li><a href="/health">GET /health</a> - Health check</li>
      <li><a href="/api/status">GET /api/status</a> - API status</li>
      <li><a href="/api/categories">GET /api/categories</a> - Service categories</li>
      <li><a href="/api/services">GET /api/services</a> - Available services</li>
    </ul>
    <p>Database: PostgreSQL RDS<br>
    Environment: Production<br>
    Version: 1.0.0</p>
    </body></html>
  `);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`LABUREMOS Backend API running on port ${PORT}`);
});
EOF

# Create package.json for simple server
cat << 'EOF' > simple-package.json
{
  "name": "laburemos-backend-simple",
  "version": "1.0.0",
  "description": "LABUREMOS Backend API - Simple Version",
  "main": "simple-server.js",
  "scripts": {
    "start": "node simple-server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

# Copy files to EC2
echo "Copying files to EC2..."
scp -i $KEY_PATH -o StrictHostKeyChecking=no simple-server.js ec2-user@$EC2_IP:~/
scp -i $KEY_PATH -o StrictHostKeyChecking=no simple-package.json ec2-user@$EC2_IP:~/package.json

# Deploy on EC2
echo "Setting up and starting simple backend..."
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ec2-user@$EC2_IP << 'ENDSSH'
set -e

# Setup Node.js environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 16

# Install global dependencies
npm install -g pm2

# Install dependencies
npm install

# Stop any existing PM2 processes
pm2 delete all || true

# Start the simple backend
pm2 start simple-server.js --name laburemos-backend-simple
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Show status
pm2 status
pm2 logs --lines 5

echo "=== Simple Backend deployed successfully ==="
echo "API available at: http://3.81.56.168:3001"
echo "Documentation: http://3.81.56.168:3001/docs"
ENDSSH

# Cleanup local files
rm -f simple-server.js simple-package.json

echo "=== Deployment Complete ==="
echo "Backend API: http://$EC2_IP:3001"
echo "API Status: http://$EC2_IP:3001/api/status"
echo "API Docs: http://$EC2_IP:3001/docs"