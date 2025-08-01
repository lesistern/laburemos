import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private isEnabled: boolean;
  private isConnected: boolean = false;

  constructor(private configService: ConfigService) {
    // Check if Redis is enabled (default: true for production, false for development)
    this.isEnabled = this.configService.get<boolean>('redis.enabled', 
      process.env.NODE_ENV === 'production'
    );

    if (this.isEnabled) {
      const redisConfig = {
        host: this.configService.get<string>('redis.host', 'localhost'),
        port: this.configService.get<number>('redis.port', 6379),
        password: this.configService.get<string>('redis.password'),
        db: this.configService.get<number>('redis.db', 0),
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        lazyConnect: true,
      };

      try {
        this.client = new Redis(redisConfig);
        this.publisher = new Redis(redisConfig);
        this.subscriber = new Redis(redisConfig);

        // Error handling with graceful degradation
        this.client.on('error', (err) => {
          this.logger.error('Redis client error:', err);
          this.isConnected = false;
        });

        this.publisher.on('error', (err) => {
          this.logger.error('Redis publisher error:', err);
        });

        this.subscriber.on('error', (err) => {
          this.logger.error('Redis subscriber error:', err);
        });

        // Connection events
        this.client.on('connect', () => {
          this.logger.log('✅ Redis client connected');
          this.isConnected = true;
        });

        this.client.on('ready', () => {
          this.logger.log('✅ Redis client ready');
          this.isConnected = true;
        });

        this.client.on('close', () => {
          this.logger.warn('⚠️ Redis client connection closed');
          this.isConnected = false;
        });
      } catch (error) {
        this.logger.error('❌ Error initializing Redis clients:', error);
        this.isEnabled = false;
      }
    } else {
      this.logger.warn('⚠️ Redis is disabled - running in mock mode');
    }
  }

  async onModuleInit() {
    if (!this.isEnabled) {
      this.logger.log('✅ Redis service initialized in mock mode');
      return;
    }

    try {
      if (this.client) {
        await this.client.connect();
        await this.client.ping();
        this.isConnected = true;
        this.logger.log('✅ Redis connection established');
      }
    } catch (error) {
      this.logger.error('❌ Failed to connect to Redis:', error);
      this.logger.warn('⚠️ Continuing in mock mode without Redis');
      this.isEnabled = false;
      this.isConnected = false;
      // Don't throw error - allow app to continue without Redis
    }
  }

  async onModuleDestroy() {
    try {
      await Promise.all([
        this.client.quit(),
        this.publisher.quit(),
        this.subscriber.quit(),
      ]);
      this.logger.log('✅ Redis connections closed');
    } catch (error) {
      this.logger.error('❌ Error closing Redis connections:', error);
    }
  }

  // Helper method to check if Redis is available
  private isRedisAvailable(): boolean {
    return this.isEnabled && this.isConnected && this.client !== null;
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    if (!this.isRedisAvailable()) {
      this.logger.debug(`Redis not available - mock get for key: ${key}`);
      return null;
    }
    
    try {
      return await this.client!.get(key);
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.isRedisAvailable()) {
      this.logger.debug(`Redis not available - mock set for key: ${key}`);
      return true; // Return success for mock mode
    }
    
    try {
      if (ttl) {
        await this.client!.setex(key, ttl, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isRedisAvailable()) {
      this.logger.debug(`Redis not available - mock del for key: ${key}`);
      return true;
    }
    
    try {
      const result = await this.client!.del(key);
      return result > 0;
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isRedisAvailable()) {
      this.logger.debug(`Redis not available - mock exists for key: ${key}`);
      return false;
    }
    
    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to set expiry for key ${key}:`, error);
      return false;
    }
  }

  // JSON operations
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to get JSON for key ${key}:`, error);
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      return await this.set(key, jsonValue, ttl);
    } catch (error) {
      this.logger.error(`Failed to set JSON for key ${key}:`, error);
      return false;
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      this.logger.error(`Failed to hget ${key}:${field}:`, error);
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hset(key, field, value);
      return true;
    } catch (error) {
      this.logger.error(`Failed to hset ${key}:${field}:`, error);
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      this.logger.error(`Failed to hgetall ${key}:`, error);
      return null;
    }
  }

  async hdel(key: string, field: string): Promise<boolean> {
    try {
      const result = await this.client.hdel(key, field);
      return result > 0;
    } catch (error) {
      this.logger.error(`Failed to hdel ${key}:${field}:`, error);
      return false;
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lpush(key, ...values);
    } catch (error) {
      this.logger.error(`Failed to lpush to ${key}:`, error);
      return 0;
    }
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.rpush(key, ...values);
    } catch (error) {
      this.logger.error(`Failed to rpush to ${key}:`, error);
      return 0;
    }
  }

  async lpop(key: string): Promise<string | null> {
    try {
      return await this.client.lpop(key);
    } catch (error) {
      this.logger.error(`Failed to lpop from ${key}:`, error);
      return null;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rpop(key);
    } catch (error) {
      this.logger.error(`Failed to rpop from ${key}:`, error);
      return null;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lrange(key, start, stop);
    } catch (error) {
      this.logger.error(`Failed to lrange ${key}:`, error);
      return [];
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sadd(key, ...members);
    } catch (error) {
      this.logger.error(`Failed to sadd to ${key}:`, error);
      return 0;
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.srem(key, ...members);
    } catch (error) {
      this.logger.error(`Failed to srem from ${key}:`, error);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      this.logger.error(`Failed to smembers ${key}:`, error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, member);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to sismember ${key}:`, error);
      return false;
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    try {
      return await this.publisher.publish(channel, message);
    } catch (error) {
      this.logger.error(`Failed to publish to ${channel}:`, error);
      return 0;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to subscribe to ${channel}:`, error);
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from ${channel}:`, error);
    }
  }

  // Utility methods
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Failed to get keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  async flushdb(): Promise<boolean> {
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      this.logger.error('Failed to flush database:', error);
      return false;
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Failed to ping Redis:', error);
      return false;
    }
  }

  // Session management
  async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<boolean> {
    return await this.setJson(`session:${sessionId}`, data, ttl);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    return await this.getJson<T>(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return await this.del(`session:${sessionId}`);
  }

  // Rate limiting
  async incrementRateLimit(key: string, ttl: number = 60): Promise<number> {
    try {
      const current = await this.client.incr(key);
      if (current === 1) {
        await this.client.expire(key, ttl);
      }
      return current;
    } catch (error) {
      this.logger.error(`Failed to increment rate limit for ${key}:`, error);
      return 0;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const result = await this.ping();
      return {
        status: result ? 'healthy' : 'unhealthy',
        message: result ? 'Redis connection is healthy' : 'Redis connection failed',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Redis health check failed: ${error.message}`,
      };
    }
  }

  // Get client for advanced operations
  getClient(): Redis {
    return this.client;
  }

  getPublisher(): Redis {
    return this.publisher;
  }

  getSubscriber(): Redis {
    return this.subscriber;
  }
}