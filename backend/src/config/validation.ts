import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_VERSION: Joi.string().default('v1'),
  APP_NAME: Joi.string().default('LABUREMOS API'),

  // Database
  DATABASE_URL: Joi.string().required(),
  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow(''),
  REDIS_DB: Joi.number().default(0),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // CORS
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: Joi.boolean().default(true),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60),
  RATE_LIMIT_LIMIT: Joi.number().default(100),

  // Email
  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().email(),
  SMTP_PASS: Joi.string(),
  EMAIL_FROM: Joi.string().email().default('contacto.laburemos@gmail.com'),

  // Stripe
  STRIPE_SECRET_KEY: Joi.string().pattern(/^sk_(test_|live_)/),
  STRIPE_PUBLISHABLE_KEY: Joi.string().pattern(/^pk_(test_|live_)/),
  STRIPE_WEBHOOK_SECRET: Joi.string().pattern(/^whsec_/),

  // File Upload
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
  ALLOWED_FILE_TYPES: Joi.string().default('jpg,jpeg,png,gif,pdf,doc,docx,txt'),
  UPLOAD_PATH: Joi.string().default('./uploads'),

  // Security
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),
  PASSWORD_MIN_LENGTH: Joi.number().min(6).default(8),
  SESSION_SECRET: Joi.string().min(32).required(),

  // WebSocket
  WS_PORT: Joi.number().default(3001),
  WS_CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // Microservices
  AUTH_SERVICE_PORT: Joi.number().default(3002),
  USER_SERVICE_PORT: Joi.number().default(3003),
  PROJECT_SERVICE_PORT: Joi.number().default(3004),
  PAYMENT_SERVICE_PORT: Joi.number().default(3005),
  NOTIFICATION_SERVICE_PORT: Joi.number().default(3006),

  // Cache
  CACHE_TTL: Joi.number().default(300),
  CACHE_MAX: Joi.number().default(100),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
  LOG_FILE_PATH: Joi.string().default('./logs/app.log'),
});