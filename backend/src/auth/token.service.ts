import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { AuthPayload } from './auth.service';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate JWT access token
   */
  async generateAccessToken(payload: AuthPayload): Promise<string> {
    try {
      return this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      });
    } catch (error) {
      this.logger.error('Failed to generate access token:', error);
      throw error;
    }
  }

  /**
   * Generate JWT refresh token
   */
  async generateRefreshToken(payload: AuthPayload): Promise<string> {
    try {
      return this.jwtService.sign(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      });
    } catch (error) {
      this.logger.error('Failed to generate refresh token:', error);
      throw error;
    }
  }

  /**
   * Verify JWT access token
   */
  async verifyAccessToken(token: string): Promise<AuthPayload> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
    } catch (error) {
      this.logger.error('Failed to verify access token:', error.message);
      throw error;
    }
  }

  /**
   * Verify JWT refresh token
   */
  async verifyRefreshToken(token: string): Promise<AuthPayload> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch (error) {
      this.logger.error('Failed to verify refresh token:', error.message);
      throw error;
    }
  }

  /**
   * Decode JWT token without verification
   */
  decodeToken(token: string): any {
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      this.logger.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Generate secure random token for password reset
   */
  async generatePasswordResetToken(): Promise<string> {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate secure random token for email verification
   */
  async generateEmailVerificationToken(): Promise<string> {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate API key
   */
  async generateApiKey(): Promise<string> {
    const prefix = 'lbr_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to get token expiration:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) return true;
      return new Date() > expiration;
    } catch (error) {
      this.logger.error('Failed to check token expiration:', error);
      return true;
    }
  }

  /**
   * Get remaining token time in seconds
   */
  getRemainingTime(token: string): number | null {
    try {
      const expiration = this.getTokenExpiration(token);
      if (!expiration) return null;
      const remaining = Math.floor((expiration.getTime() - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    } catch (error) {
      this.logger.error('Failed to get remaining token time:', error);
      return null;
    }
  }

  /**
   * Generate tokens for different purposes
   */
  async generateTokens(payload: AuthPayload): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Validate token format
   */
  isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3;
  }

  /**
   * Generate session token
   */
  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash token for storage
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Compare token with hash
   */
  compareTokenWithHash(token: string, hash: string): boolean {
    const tokenHash = this.hashToken(token);
    return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
  }
}