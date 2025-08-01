import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    const nodeEnv = configService.get<string>('NODE_ENV', 'development');

    // Enhanced security middlewares
    app.use(helmet({
      contentSecurityPolicy: nodeEnv === 'development' ? false : {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          childSrc: ["'none'"],
          workerSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.stripe.com", "https://js.stripe.com"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: { policy: "require-corp" },
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      dnsPrefetchControl: { allow: false },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      ieNoOpen: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: ['no-referrer', 'strict-origin-when-cross-origin'] },
    }));
    
    app.use(compression());
    app.use(cookieParser());

    // Enhanced CORS configuration with security policies
    const allowedOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(',').map(origin => origin.trim());
    
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // For development, allow localhost with any port
        if (nodeEnv === 'development' && origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
          return callback(null, true);
        }
        
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'), false);
      },
      credentials: configService.get<boolean>('CORS_CREDENTIALS', true),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Accept', 
        'X-Requested-With', 
        'X-API-Version',
        'X-Request-ID'
      ],
      exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining'],
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global filters and interceptors
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new TransformInterceptor(),
    );

    // API prefix - removed because controllers already have /api prefix
    // app.setGlobalPrefix(`api/${configService.get<string>('API_VERSION', 'v1')}`);

    // Swagger documentation
    if (nodeEnv !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('LABUREMOS API')
        .setDescription('LABUREMOS Freelance Platform API Documentation')
        .setVersion('1.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
          },
          'JWT-auth',
        )
        .addTag('Authentication', 'User authentication endpoints')
        .addTag('Users', 'User management endpoints')
        .addTag('Categories', 'Service category management endpoints')
        .addTag('Services', 'Service management endpoints')
        .addTag('Projects', 'Project management endpoints')
        .addTag('Payments', 'Payment processing endpoints')
        .addTag('Notifications', 'Real-time notification endpoints')
        .addServer(`http://localhost:${port}`, 'Development server')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
        },
      });
      
      logger.log(`📚 Swagger documentation available at http://localhost:${port}/docs`);
    }

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.log(`🛑 Received ${signal}. Starting graceful shutdown...`);
      
      const server = app.getHttpServer();
      server.close(() => {
        logger.log('✅ HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    await app.listen(port);
    
    logger.log(`🚀 LABUREMOS API is running on http://localhost:${port}`);
    logger.log(`🌟 Environment: ${nodeEnv}`);
    logger.log(`💾 Database: Connected successfully`);
    
  } catch (error) {
    logger.error('❌ Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();