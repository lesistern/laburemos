import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService, AuthPayload } from '../auth.service';
import { User } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: AuthPayload): Promise<Omit<User, 'passwordHash'>> {
    try {
      const user = await this.authService.getUserById(payload.sub);
      
      if (!user) {
        this.logger.warn(`JWT validation failed: User not found (ID: ${payload.sub})`);
        throw new UnauthorizedException('Invalid token: User not found');
      }

      if (!user.isActive) {
        this.logger.warn(`JWT validation failed: User inactive (ID: ${payload.sub})`);
        throw new UnauthorizedException('Account is deactivated');
      }

      // Additional security check: verify token hasn't been blacklisted
      // This could be implemented with Redis to store blacklisted tokens

      this.logger.debug(`JWT validation successful for user: ${user.email} (ID: ${user.id})`);
      return user;
      
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`JWT validation error:`, error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}