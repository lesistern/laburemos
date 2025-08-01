import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const userId = (request as any).user?.id;
    
    const startTime = Date.now();
    
    // Create request log
    const requestLog = {
      method,
      url,
      ip,
      userAgent,
      userId,
      timestamp: new Date().toISOString(),
      body: this.sanitizeBody(request.body),
      query: request.query,
      params: request.params,
    };

    this.logger.log(`📨 Incoming Request: ${method} ${url}`, {
      ...requestLog,
      body: method !== 'GET' ? requestLog.body : undefined,
    });

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const { statusCode } = response;

        // Create response log
        const responseLog = {
          method,
          url,
          statusCode,
          duration: `${duration}ms`,
          userId,
          timestamp: new Date().toISOString(),
          responseSize: JSON.stringify(data).length,
        };

        // Log based on status code
        if (statusCode >= 400) {
          this.logger.warn(`⚠️ Request Failed: ${method} ${url} - ${statusCode}`, responseLog);
        } else {
          this.logger.log(`✅ Request Completed: ${method} ${url} - ${statusCode}`, responseLog);
        }

        // Log slow requests
        if (duration > 1000) {
          this.logger.warn(`🐌 Slow Request: ${method} ${url} took ${duration}ms`, {
            ...responseLog,
            warning: 'SLOW_REQUEST',
          });
        }
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        const errorLog = {
          method,
          url,
          duration: `${duration}ms`,
          userId,
          timestamp: new Date().toISOString(),
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        };

        this.logger.error(`❌ Request Error: ${method} ${url}`, errorLog);
        
        throw error;
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'apiKey',
      'secret',
      'creditCard',
      'ssn',
      'socialSecurityNumber',
    ];

    const sanitized = { ...body };

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeBody(sanitized[key]);
      }
    });

    return sanitized;
  }
}