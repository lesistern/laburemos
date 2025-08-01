#!/bin/bash
# Script para instalar seguridad en API simple de producción
# Ejecutar en: EC2 instance (ssh ec2-user@3.81.56.168)

echo "🛡️ Instalando mejoras de seguridad en API simple..."

# Instalar dependencias
npm install helmet cors

# Backup del archivo actual
cp app.js app.js.backup

# Agregar configuración de seguridad
cat >> app.js << 'SECURITY'

// === CONFIGURACIÓN DE SEGURIDAD ===
const helmet = require('helmet');
const cors = require('cors');

// Headers de seguridad
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  frameguard: { action: 'deny' }
}));

// CORS restrictivo
app.use(cors({
  origin: ['https://laburemos.com.ar', 'https://www.laburemos.com.ar'],
  credentials: true
}));

// Ocultar tecnología
app.disable('x-powered-by');

console.log('✅ Configuración de seguridad aplicada');
SECURITY

# Reiniciar servicio
pm2 restart all

echo "✅ Seguridad instalada y servicio reiniciado"
