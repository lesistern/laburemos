import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export interface SecretData {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  SESSION_SECRET: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  REDIS_URL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
}

@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name);
  private secretsClient: SecretsManagerClient;
  private cachedSecrets: SecretData | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(private configService: ConfigService) {
    // Solo inicializar AWS Secrets Manager en producción
    if (this.configService.get('NODE_ENV') === 'production') {
      this.secretsClient = new SecretsManagerClient({
        region: this.configService.get('AWS_REGION', 'us-east-1'),
      });
    }
  }

  /**
   * Obtiene un valor de configuración con fallback a Secrets Manager
   */
  async get<T = string>(key: keyof SecretData, defaultValue?: T): Promise<T> {
    // En desarrollo, usar variables de entorno locales
    if (this.configService.get('NODE_ENV') !== 'production') {
      return this.configService.get(key, defaultValue);
    }

    try {
      const secrets = await this.getSecrets();
      return (secrets[key] as T) || defaultValue;
    } catch (error) {
      this.logger.warn(`Failed to get secret ${key}, falling back to env var:`, error.message);
      return this.configService.get(key, defaultValue);
    }
  }

  /**
   * Obtiene todos los secrets de AWS Secrets Manager con cache
   */
  private async getSecrets(): Promise<SecretData> {
    const now = Date.now();
    
    // Usar cache si está disponible y no expiró
    if (this.cachedSecrets && now < this.cacheExpiry) {
      return this.cachedSecrets;
    }

    try {
      const secretName = this.configService.get('AWS_SECRET_NAME', 'laburemos/production');
      
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      this.logger.log(`Fetching secrets from AWS Secrets Manager: ${secretName}`);
      const response = await this.secretsClient.send(command);
      
      if (!response.SecretString) {
        throw new Error('No secret string found in response');
      }

      const secrets = JSON.parse(response.SecretString) as SecretData;
      
      // Validar que los secrets críticos estén presentes
      this.validateSecrets(secrets);
      
      // Actualizar cache
      this.cachedSecrets = secrets;
      this.cacheExpiry = now + this.CACHE_TTL;
      
      this.logger.log('Successfully fetched and cached secrets from AWS');
      return secrets;
      
    } catch (error) {
      this.logger.error('Failed to fetch secrets from AWS Secrets Manager:', error);
      throw error;
    }
  }

  /**
   * Valida que los secrets críticos estén presentes
   */
  private validateSecrets(secrets: SecretData): void {
    const requiredSecrets: (keyof SecretData)[] = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SESSION_SECRET'
    ];

    const missingSecrets = requiredSecrets.filter(key => !secrets[key]);
    
    if (missingSecrets.length > 0) {
      throw new Error(`Missing required secrets: ${missingSecrets.join(', ')}`);
    }
  }

  /**
   * Fuerza la renovación del cache de secrets
   */
  async refreshSecrets(): Promise<void> {
    this.cachedSecrets = null;
    this.cacheExpiry = 0;
    await this.getSecrets();
    this.logger.log('Secrets cache refreshed successfully');
  }

  /**
   * Health check del servicio de secrets
   */
  async healthCheck(): Promise<{ status: string; lastFetch?: string; cacheExpiry?: string }> {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    
    if (!isProduction) {
      return { status: 'development_mode' };
    }

    try {
      await this.getSecrets();
      return {
        status: 'healthy',
        lastFetch: new Date().toISOString(),
        cacheExpiry: new Date(this.cacheExpiry).toISOString(),
      };
    } catch (error) {
      this.logger.error('Secrets health check failed:', error);
      return { status: 'unhealthy' };
    }
  }

  /**
   * Obtiene la configuración de la base de datos de manera segura
   */
  async getDatabaseConfig() {
    const databaseUrl = await this.get('DATABASE_URL');
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    // Log solo el host de la base de datos para debugging (sin credenciales)
    const dbHost = databaseUrl.split('@')[1]?.split('/')[0] || 'unknown';
    this.logger.log(`Database configured for host: ${dbHost}`);
    
    return databaseUrl;
  }

  /**
   * Obtiene la configuración JWT de manera segura
   */
  async getJWTConfig() {
    const [jwtSecret, jwtRefreshSecret] = await Promise.all([
      this.get('JWT_SECRET'),
      this.get('JWT_REFRESH_SECRET'),
    ]);

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets not configured');
    }

    return {
      secret: jwtSecret,
      refreshSecret: jwtRefreshSecret,
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
      refreshExpiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    };
  }

  /**
   * Obtiene la configuración de sesión de manera segura
   */
  async getSessionConfig() {
    const sessionSecret = await this.get('SESSION_SECRET');
    
    if (!sessionSecret) {
      throw new Error('SESSION_SECRET not configured');
    }

    return sessionSecret;
  }
}