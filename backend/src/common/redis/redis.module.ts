import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { RedisMockService } from './redis-mock.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RedisService,
      useFactory: async (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('app.nodeEnv');
        const redisEnabled = configService.get<string>('REDIS_ENABLED') !== 'false';
        
        // En desarrollo, si Redis no está habilitado, usar mock
        if (nodeEnv === 'development' && !redisEnabled) {
          console.log('📌 Usando Redis Mock Service para desarrollo');
          return new RedisMockService();
        }
        
        // Intentar conectar a Redis real
        try {
          const redisService = new RedisService(configService);
          // Verificar conexión
          await redisService.onModuleInit();
          return redisService;
        } catch (error) {
          // Si falla en desarrollo, usar mock
          if (nodeEnv === 'development') {
            console.log('⚠️ Redis no disponible, usando Mock Service');
            return new RedisMockService();
          }
          // En producción, fallar
          throw error;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}