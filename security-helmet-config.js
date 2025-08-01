// Configuración Helmet.js para API Simple de Producción
// Aplicar en: http://3.81.56.168:3001

const helmet = require('helmet');
const cors = require('cors');

// Configuración de headers de seguridad
const securityHeaders = helmet({
  contentSecurityPolicy: false, // Para API, no necesario
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  dnsPrefetchControl: { allow: false },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Configuración CORS restrictiva
const corsConfig = cors({
  origin: [
    'https://laburemos.com.ar',
    'https://www.laburemos.com.ar',
    'https://d2ijlktcsmmfsd.cloudfront.net'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 horas
});

module.exports = { securityHeaders, corsConfig };

// Uso en la aplicación:
// app.use(securityHeaders);
// app.use(corsConfig);
// app.disable('x-powered-by');
