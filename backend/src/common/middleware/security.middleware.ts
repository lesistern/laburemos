import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  constructor(private readonly redis: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const clientIp = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const method = req.method;
    const url = req.originalUrl;

    // Configurar headers de seguridad adicionales
    this.setSecurityHeaders(res);

    // Detectar patrones de ataque
    await this.detectAttackPatterns(req, clientIp);

    // Log de requests para análisis de seguridad
    this.logSecurityEvent(req, clientIp, userAgent);

    // Continuar con la request
    next();

    // Log de respuesta (después de que se procese)
    const duration = Date.now() - startTime;
    this.logger.log(`${method} ${url} - ${res.statusCode} - ${clientIp} - ${duration}ms`);
  }

  /**
   * Configurar headers de seguridad adicionales
   */
  private setSecurityHeaders(res: Response): void {
    // Identificación del servidor (sin revelar versión)
    res.setHeader('Server', 'LABUREMOS');

    // Headers de cache para endpoints sensibles
    if (res.req.url?.includes('/api/auth') || res.req.url?.includes('/api/admin')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    // Header personalizado para rate limiting info
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Content Security Policy específico para API
    if (res.req.url?.includes('/api/')) {
      res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';");
    }
  }

  /**
   * Detectar patrones de ataque comunes
   */
  private async detectAttackPatterns(req: Request, clientIp: string): Promise<void> {
    const url = req.originalUrl.toLowerCase();
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();
    const body = JSON.stringify(req.body || {}).toLowerCase();
    const query = new URLSearchParams(req.query as any).toString().toLowerCase();

    const attackPatterns = {
      sqlInjection: [
        /union.*select/i,
        /drop.*table/i,
        /insert.*into/i,
        /delete.*from/i,
        /update.*set/i,
        /exec.*xp_/i,
        /script.*alert/i,
        /'.*or.*'.*=/i,
        /--.*\s/i,
      ],
      xss: [
        /<script.*>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe.*>/i,
        /eval\s*\(/i,
        /expression\s*\(/i,
      ],
      pathTraversal: [
        /\.\.\//g,
        /\.\.\\\/g,
        /%2e%2e%2f/gi,
        /%2e%2e%5c/gi,
        /\/etc\/passwd/i,
        /\/windows\/system32/i,
      ],
      commandInjection: [
        /;\s*(rm|del|format|shutdown)/i,
        /\|\s*(nc|netcat|curl|wget)/i,
        /`.*`/g,
        /\$\(.*\)/g,
      ],
      suspiciousUserAgents: [
        /sqlmap/i,
        /nmap/i,
        /nikto/i,
        /burp/i,
        /dirb/i,
        /gobuster/i,
        /masscan/i,
      ],
    };

    const detectedAttacks: string[] = [];
    const fullRequest = `${url} ${body} ${query}`;

    // Verificar patrones de SQL Injection
    if (attackPatterns.sqlInjection.some(pattern => pattern.test(fullRequest))) {
      detectedAttacks.push('sql_injection');
    }

    // Verificar patrones de XSS
    if (attackPatterns.xss.some(pattern => pattern.test(fullRequest))) {
      detectedAttacks.push('xss');
    }

    // Verificar path traversal
    if (attackPatterns.pathTraversal.some(pattern => pattern.test(fullRequest))) {
      detectedAttacks.push('path_traversal');
    }

    // Verificar command injection
    if (attackPatterns.commandInjection.some(pattern => pattern.test(fullRequest))) {
      detectedAttacks.push('command_injection');
    }

    // Verificar user agents sospechosos
    if (attackPatterns.suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
      detectedAttacks.push('suspicious_user_agent');
    }

    // Si se detectaron ataques, registrar y potencialmente bloquear
    if (detectedAttacks.length > 0) {
      await this.handleAttackDetection(clientIp, detectedAttacks, req);
    }
  }

  /**
   * Manejar detección de ataques
   */
  private async handleAttackDetection(
    clientIp: string,
    attackTypes: string[],
    req: Request,
  ): Promise<void> {
    const attackEvent = {
      timestamp: new Date().toISOString(),
      ip: clientIp,
      attackTypes,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.headers['user-agent'],
      body: req.body,
      query: req.query,
      severity: 'high',
    };

    try {
      // Registrar el ataque
      await this.redis.lpush('attack_logs', JSON.stringify(attackEvent));
      await this.redis.ltrim('attack_logs', 0, 4999); // Mantener últimos 5k

      // Incrementar contador de ataques para esta IP
      const attackKey = `attacks:${clientIp}`;
      const attackCount = await this.redis.incr(attackKey);
      await this.redis.expire(attackKey, 3600); // 1 hora

      // Log crítico
      this.logger.error(
        `ATTACK DETECTED from ${clientIp}: ${attackTypes.join(', ')} ` +
        `on ${req.method} ${req.originalUrl} (Count: ${attackCount})`,
      );

      // Auto-blacklist después de múltiples ataques
      if (attackCount >= 3) {
        await this.redis.set(`blacklist:${clientIp}`, '1', 86400); // 24 horas
        this.logger.error(`IP ${clientIp} BLACKLISTED after ${attackCount} attacks`);

        // Alerta crítica para administradores
        await this.redis.lpush('critical_alerts', JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'attack_blacklist',
          ip: clientIp,
          attackCount,
          attackTypes,
          message: `IP ${clientIp} has been blacklisted due to multiple attack attempts`,
        }));
      }

    } catch (error) {
      this.logger.error('Error handling attack detection:', error);
    }
  }

  /**
   * Registrar eventos de seguridad para análisis
   */
  private logSecurityEvent(req: Request, clientIp: string, userAgent: string): void {
    // Solo log requests importantes para análisis
    const importantPaths = ['/api/auth', '/api/admin', '/api/payments', '/api/upload'];
    const shouldLog = importantPaths.some(path => req.originalUrl.includes(path));

    if (shouldLog) {
      const securityEvent = {
        timestamp: new Date().toISOString(),
        ip: clientIp,
        method: req.method,
        url: req.originalUrl,
        userAgent,
        referer: req.headers.referer,
        acceptLanguage: req.headers['accept-language'],
        contentLength: req.headers['content-length'],
      };

      // Log asíncrono para no bloquear la request
      setImmediate(async () => {
        try {
          await this.redis.lpush('access_logs', JSON.stringify(securityEvent));
          await this.redis.ltrim('access_logs', 0, 9999); // Mantener últimos 10k
        } catch (error) {
          this.logger.error('Error logging security event:', error);
        }
      });
    }
  }

  /**
   * Obtener IP real del cliente
   */
  private getClientIp(req: Request): string {
    return (
      req.headers['cf-connecting-ip'] as string || // Cloudflare
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.headers['x-real-ip'] as string ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown'
    );
  }
}