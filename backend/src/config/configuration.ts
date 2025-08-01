export const configuration = () => ({
  // Application
  app: {
    name: process.env.APP_NAME || 'LABUREMOS API',
    port: parseInt(process.env.PORT, 10) || 3000,
    apiVersion: process.env.API_VERSION || 'v1',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    username: process.env.POSTGRES_USER || 'laburemos_user',
    password: process.env.POSTGRES_PASSWORD || 'laburemos_password',
    database: process.env.POSTGRES_DB || 'laburemos_db',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },

  // CORS
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Rate Limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    limit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 100,
  },

  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: process.env.EMAIL_FROM || 'contacto.laburemos@gmail.com',
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx,txt').split(','),
    path: process.env.UPLOAD_PATH || './uploads',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8,
    sessionSecret: process.env.SESSION_SECRET,
  },

  // WebSocket
  websocket: {
    port: parseInt(process.env.WS_PORT, 10) || 3001,
    corsOrigins: (process.env.WS_CORS_ORIGINS || 'http://localhost:3000').split(','),
  },

  // Microservices
  microservices: {
    auth: {
      port: parseInt(process.env.AUTH_SERVICE_PORT, 10) || 3002,
    },
    user: {
      port: parseInt(process.env.USER_SERVICE_PORT, 10) || 3003,
    },
    project: {
      port: parseInt(process.env.PROJECT_SERVICE_PORT, 10) || 3004,
    },
    payment: {
      port: parseInt(process.env.PAYMENT_SERVICE_PORT, 10) || 3005,
    },
    notification: {
      port: parseInt(process.env.NOTIFICATION_SERVICE_PORT, 10) || 3006,
    },
  },

  // Cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
    max: parseInt(process.env.CACHE_MAX, 10) || 100,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },
});