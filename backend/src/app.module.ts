import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as redisStore from 'cache-manager-redis-store';

// Core modules
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './common/redis/redis.module';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { ServiceModule } from './service/service.module';
import { ProjectModule } from './project/project.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { NdaModule } from './nda/nda.module';

// Configuration
import { configuration } from './config/configuration';
import { validationSchema } from './config/validation';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: ['.env.local', '.env'],
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Logging
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack, context }) => {
          let log = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;
          if (stack) {
            log += `\n${stack}`;
          }
          return log;
        }),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: process.env.LOG_FILE_PATH || 'logs/app.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: process.env.LOG_FILE_PATH || 'logs/combined.log',
        }),
      ],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Caching
    CacheModule.register({
      isGlobal: true,
      store: redisStore as any,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      ttl: parseInt(process.env.CACHE_TTL || '300'),
      max: parseInt(process.env.CACHE_MAX || '100'),
    }),

    // Task scheduling
    ScheduleModule.forRoot(),

    // Core modules
    DatabaseModule,
    RedisModule,

    // Feature modules
    AuthModule,
    UserModule,
    CategoryModule,
    ServiceModule,
    ProjectModule,
    PaymentModule,
    NotificationModule,
    AdminModule,
    NdaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}