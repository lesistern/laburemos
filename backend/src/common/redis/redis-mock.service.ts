import { Injectable, Logger } from '@nestjs/common';

/**
 * Mock Redis Service para desarrollo sin Redis
 */
@Injectable()
export class RedisMockService {
  private readonly logger = new Logger(RedisMockService.name);
  private mockStorage = new Map<string, any>();

  constructor() {
    this.logger.warn('⚠️ Usando Redis Mock Service - Solo para desarrollo');
  }

  async onModuleInit() {
    this.logger.log('✅ Redis Mock Service inicializado');
  }

  async onModuleDestroy() {
    this.mockStorage.clear();
    this.logger.log('✅ Redis Mock Service cerrado');
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    return this.mockStorage.get(key) || null;
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    this.mockStorage.set(key, value);
    if (ttl) {
      setTimeout(() => this.mockStorage.delete(key), ttl * 1000);
    }
    return true;
  }

  async del(key: string): Promise<boolean> {
    return this.mockStorage.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.mockStorage.has(key);
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const value = this.mockStorage.get(key);
    if (value) {
      setTimeout(() => this.mockStorage.delete(key), ttl * 1000);
      return true;
    }
    return false;
  }

  // JSON operations
  async getJson<T>(key: string): Promise<T | null> {
    const value = this.mockStorage.get(key);
    return value ? JSON.parse(value) : null;
  }

  async setJson<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    return this.set(key, JSON.stringify(value), ttl);
  }

  // Session management
  async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<boolean> {
    return this.setJson(`session:${sessionId}`, data, ttl);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.getJson<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  // Rate limiting
  async incrementRateLimit(key: string, ttl: number = 60): Promise<number> {
    const current = parseInt(await this.get(key) || '0');
    const newValue = current + 1;
    await this.set(key, newValue.toString(), ttl);
    return newValue;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    return {
      status: 'healthy',
      message: 'Redis Mock Service (desarrollo) - No usar en producción',
    };
  }

  // Stub methods for compatibility
  async hget(): Promise<null> { return null; }
  async hset(): Promise<boolean> { return true; }
  async hgetall(): Promise<null> { return null; }
  async hdel(): Promise<boolean> { return true; }
  async lpush(): Promise<number> { return 0; }
  async rpush(): Promise<number> { return 0; }
  async lpop(): Promise<null> { return null; }
  async rpop(): Promise<null> { return null; }
  async lrange(): Promise<string[]> { return []; }
  async sadd(): Promise<number> { return 0; }
  async srem(): Promise<number> { return 0; }
  async smembers(): Promise<string[]> { return []; }
  async sismember(): Promise<boolean> { return false; }
  async publish(): Promise<number> { return 0; }
  async subscribe(): Promise<void> { }
  async unsubscribe(): Promise<void> { }
  async keys(): Promise<string[]> { return Array.from(this.mockStorage.keys()); }
  async flushdb(): Promise<boolean> { this.mockStorage.clear(); return true; }
  async ping(): Promise<boolean> { return true; }
  getClient(): any { return null; }
  getPublisher(): any { return null; }
  getSubscriber(): any { return null; }
}