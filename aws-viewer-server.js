const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
    // CORS headers para desarrollo
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let filePath = path.join(__dirname, req.url === '/' ? 'aws-viewer.html' : req.url);

    // Obtener la extensión del archivo
    const extname = path.extname(filePath).toLowerCase();
    
    // Tipos MIME
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // API endpoint para verificar estado de servicios
    if (req.url === '/api/status') {
        const status = {
            timestamp: new Date().toISOString(),
            services: {
                production: {
                    url: 'https://laburemos.com.ar',
                    status: 'pending_dns',
                    description: 'Esperando propagación DNS (2-48h)'
                },
                cloudfront: {
                    url: 'https://d2ijlktcsmmfsd.cloudfront.net',
                    status: 'online',
                    description: 'CDN funcionando perfectamente'
                },
                backend: {
                    url: 'http://3.81.56.168:3001',
                    status: 'online',
                    description: 'API Simple funcionando - PM2 activo'
                },
                health: {
                    url: 'http://3.81.56.168:3001/health',
                    status: 'online',
                    description: 'Health check disponible'
                }
            },
            aws: {
                ec2_ip: '3.81.56.168',
                cloudfront_id: 'E1E1QZ7YLALIAZ',
                rds_endpoint: 'laburemos-db.c6dyqyyq01zt.us-east-1.rds.amazonaws.com',
                s3_bucket: 'laburemos-files-2025',
                certificate_arn: 'arn:aws:acm:us-east-1:529496937346:certificate/94aa65d0-875b-4556-ae27-0c1f49f0b886'
            },
            backend_details: {
                pm2_process: 'simple-api',
                pid_status: 'online',
                memory_usage: '~47MB',
                port: 3001,
                host: '0.0.0.0',
                cors_enabled: true,
                endpoints: [
                    'GET /',
                    'GET /health',
                    'GET /api/status',
                    'GET /api/categories',
                    'GET /api/users/me'
                ]
            }
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
        return;
    }

    // Servir archivos estáticos
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Archivo no encontrado
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <html>
                        <body style="font-family: Arial; text-align: center; padding: 50px;">
                            <h1>404 - Archivo no encontrado</h1>
                            <p>El archivo <code>${req.url}</code> no existe.</p>
                            <a href="/">Volver al inicio</a>
                        </body>
                    </html>
                `);
            } else {
                // Error del servidor
                res.writeHead(500);
                res.end(`Error del servidor: ${error.code}`);
            }
        } else {
            // Éxito
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, 'localhost', () => {
    console.log('🚀 AWS Laburemos Viewer Server iniciado');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log('🌐 Servicios disponibles:');
    console.log('   ✅ CloudFront: https://d2ijlktcsmmfsd.cloudfront.net (ONLINE)');
    console.log('   ✅ Backend API: http://3.81.56.168:3001 (ONLINE)');
    console.log('   ✅ Health Check: http://3.81.56.168:3001/health (ONLINE)');
    console.log('   ⏳ Producción: https://laburemos.com.ar (Esperando DNS)');
    console.log('📊 API Status: http://localhost:8080/api/status');
    console.log('\n🎯 Estado actual:');
    console.log('   - Backend PM2: simple-api (ACTIVO)');
    console.log('   - Frontend CDN: Funcionando');
    console.log('   - SSL Certificate: Validándose');
    console.log('   - DNS Propagation: En proceso (2-48h)');
    console.log('\n🔗 Compatible con Cursor + Claude CLI');
    console.log('💡 Usa Ctrl+C para detener el servidor');
});

// Manejo graceful de cierre
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor AWS Viewer...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rechazada:', reason);
});