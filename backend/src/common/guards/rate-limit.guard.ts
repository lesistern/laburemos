import { Injectable, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AdvancedRateLimitGuard extends ThrottlerGuard {
  private readonly logger = new Logger(AdvancedRateLimitGuard.name);

  constructor(
    protected readonly options: any,
    protected readonly storageService: any,
    protected readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Obtener IP del cliente (considerando proxies y CloudFront)
    const clientIp = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || 'unknown';
    const endpoint = `${request.method}:${request.route?.path || request.url}`;
    
    // Verificar si la IP está en lista negra
    if (await this.isBlacklisted(clientIp)) {
      this.logger.warn(`Blocked request from blacklisted IP: ${clientIp}`);
      throw new HttpException(
        'Access denied',
        HttpStatus.FORBIDDEN,
      );
    }

    // Rate limiting específico por endpoint
    const endpointLimits = this.getEndpointLimits(endpoint);
    const rateLimitKey = `rate_limit:${clientIp}:${endpoint}`;
    
    try {
      const current = await this.redis.incr(rateLimitKey);
      
      if (current === 1) {
        await this.redis.expire(rateLimitKey, endpointLimits.windowSeconds);
      }
      
      const remaining = Math.max(0, endpointLimits.maxRequests - current);
      
      // Agregar headers de rate limiting
      response.setHeader('X-RateLimit-Limit', endpointLimits.maxRequests);
      response.setHeader('X-RateLimit-Remaining', remaining);
      response.setHeader('X-RateLimit-Reset', Date.now() + (endpointLimits.windowSeconds * 1000));
      
      if (current > endpointLimits.maxRequests) {
        // Log para análisis de seguridad
        await this.logSuspiciousActivity(clientIp, userAgent, endpoint, current);
        
        // Incrementar contador de violaciones
        await this.incrementViolationCounter(clientIp);
        
        this.logger.warn(
          `Rate limit exceeded for ${clientIp} on ${endpoint}. ` +
          `Requests: ${current}/${endpointLimits.maxRequests}`
        );
        
        throw new HttpException(
          {
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: endpointLimits.windowSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      
      return true;
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Rate limiting error:', error);
      // En caso de error, permitir la request (fail open)
      return true;
    }
  }

  /**
   * Obtener IP del cliente considerando proxies y CDN
   */
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

  /**
   * Obtener límites específicos por endpoint
   */
  private getEndpointLimits(endpoint: string): { maxRequests: number; windowSeconds: number } {
    const endpointLimits: Record<string, { maxRequests: number; windowSeconds: number }> = {
      // Auth endpoints - más restrictivos
      'POST:/api/auth/login': { maxRequests: 5, windowSeconds: 300 }, // 5 per 5 min
      'POST:/api/auth/register': { maxRequests: 3, windowSeconds: 3600 }, // 3 per hour
      'POST:/api/auth/forgot-password': { maxRequests: 2, windowSeconds: 3600 }, // 2 per hour
      'POST:/api/auth/reset-password': { maxRequests: 3, windowSeconds: 3600 }, // 3 per hour
      
      // API endpoints - moderadamente restrictivos
      'POST:/api/projects': { maxRequests: 10, windowSeconds: 60 }, // 10 per minute
      'POST:/api/payments': { maxRequests: 5, windowSeconds: 60 }, // 5 per minute
      'POST:/api/messages': { maxRequests: 30, windowSeconds: 60 }, // 30 per minute
      
      // Search endpoints
      'GET:/api/search': { maxRequests: 50, windowSeconds: 60 }, // 50 per minute
      'GET:/api/categories': { maxRequests: 100, windowSeconds: 60 }, // 100 per minute
      
      // Admin endpoints - muy restrictivos
      'POST:/api/admin': { maxRequests: 10, windowSeconds: 300 }, // 10 per 5 min
      'DELETE:/api/admin': { maxRequests: 5, windowSeconds: 300 }, // 5 per 5 min
      
      // File upload endpoints
      'POST:/api/upload': { maxRequests: 20, windowSeconds: 60 }, // 20 per minute
      
      // Default limits
      default: { maxRequests: 100, windowSeconds: 60 }, // 100 per minute
    };

    return endpointLimits[endpoint] || endpointLimits.default;
  }

  /**
   * Verificar si una IP está en lista negra
   */
  private async isBlacklisted(ip: string): Promise<boolean> {
    try {
      const isBlacklisted = await this.redis.get(`blacklist:${ip}`);
      return !!isBlacklisted;
    } catch (error) {
      this.logger.error('Error checking blacklist:', error);
      return false;
    }
  }

  /**
   * Registrar actividad sospechosa
   */
  private async logSuspiciousActivity(
    ip: string,
    userAgent: string,
    endpoint: string,
    requestCount: number,
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      endpoint,
      requestCount,
      type: 'rate_limit_violation',
    };

    try {
      // Guardar en Redis para análisis
      await this.redis.lpush('security_logs', JSON.stringify(logEntry));
      await this.redis.ltrim('security_logs', 0, 9999); // Mantener últimos 10k logs
      
      // Log para monitoreo
      this.logger.warn(`Suspicious activity: ${JSON.stringify(logEntry)}`);
      
    } catch (error) {
      this.logger.error('Error logging suspicious activity:', error);
    }
  }

  /**
   * Incrementar contador de violaciones y blacklist automático
   */
  private async incrementViolationCounter(ip: string): Promise<void> {
    try {
      const violationKey = `violations:${ip}`;
      const violations = await this.redis.incr(violationKey);
      await this.redis.expire(violationKey, 3600); // 1 hora
      
      // Auto-blacklist después de muchas violaciones
      if (violations >= 10) {
        await this.redis.set(`blacklist:${ip}`, '1', 86400); // 24 horas
        this.logger.warn(`IP ${ip} auto-blacklisted after ${violations} violations`);
        
        // Notificar a administradores (implementar webhook/email)
        await this.notifyAdmins(`IP ${ip} has been auto-blacklisted`);
      }
      
    } catch (error) {
      this.logger.error('Error incrementing violation counter:', error);
    }
  }

  /**
   * Notificar a administradores sobre eventos críticos
   */
  private async notifyAdmins(message: string): Promise<void> {
    try {
      // Implementar notificación (webhook, email, SMS, etc.)
      this.logger.error(`SECURITY ALERT: ${message}`);
      
      // Guardar alerta para dashboard admin
      await this.redis.lpush('admin_alerts', JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'security',
        message,
        severity: 'high',
      }));
      
    } catch (error) {
      this.logger.error('Error notifying admins:', error);
    }
  }
}