import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';

export interface RateLimitConfig {
  windowMs: number;      // Ventana de tiempo en ms
  maxRequests: number;   // Máximo requests por ventana
  keyGenerator?: (req: any) => string;
  skipIf?: (req: any) => boolean;
  message?: string;
}

@Injectable()
export class AdvancedRateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Configuración por endpoint
    const config = this.reflector.get<RateLimitConfig>('rateLimit', context.getHandler()) || {
      windowMs: 15 * 60 * 1000, // 15 minutos por defecto
      maxRequests: 100,
    };

    // Generar clave única
    const key = config.keyGenerator 
      ? config.keyGenerator(request)
      : `rate_limit:${this.getClientId(request)}:${request.route?.path || request.url}`;

    // Verificar si debe saltar la verificación
    if (config.skipIf && config.skipIf(request)) {
      return true;
    }

    try {
      // Implementar sliding window con Redis
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Limpiar requests antiguos y contar actuales
      await this.redis.zremrangebyscore(key, 0, windowStart);
      const currentRequests = await this.redis.zcard(key);

      if (currentRequests >= config.maxRequests) {
        // Calcular tiempo de reset
        const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
        const resetTime = oldestRequest.length > 0 
          ? Math.ceil((parseInt(oldestRequest[1]) + config.windowMs) / 1000)
          : Math.ceil((now + config.windowMs) / 1000);

        // Headers informativos
        response.setHeader('X-RateLimit-Limit', config.maxRequests);
        response.setHeader('X-RateLimit-Remaining', 0);
        response.setHeader('X-RateLimit-Reset', resetTime);
        response.setHeader('Retry-After', Math.ceil(config.windowMs / 1000));

        throw new HttpException(
          config.message || 'Too many requests, please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Registrar request actual
      await this.redis.zadd(key, now, `${now}-${Math.random()}`);
      await this.redis.expire(key, Math.ceil(config.windowMs / 1000));

      // Headers informativos
      response.setHeader('X-RateLimit-Limit', config.maxRequests);
      response.setHeader('X-RateLimit-Remaining', config.maxRequests - currentRequests - 1);

      return true;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // En caso de error de Redis, permitir la request pero logear
      console.error('Rate limiting error:', error);
      return true;
    }
  }

  private getClientId(request: any): string {
    // Identificación inteligente del cliente
    const userId = request.user?.id;
    const ip = this.getClientIp(request);
    const userAgent = request.headers['user-agent'];
    
    if (userId) {
      return `user:${userId}`;
    }
    
    // Fingerprint básico para usuarios anónimos
    const fingerprint = Buffer.from(`${ip}:${userAgent}`).toString('base64').slice(0, 16);
    return `anonymous:${fingerprint}`;
  }

  private getClientIp(request: any): string {
    return (
      request.headers['cf-connecting-ip'] || // Cloudflare
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}

// Decorador para facilitar uso
import { SetMetadata } from '@nestjs/common';
export const RateLimit = (config: RateLimitConfig) => 
  SetMetadata('rateLimit', config);
