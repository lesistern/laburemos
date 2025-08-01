import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService, AuthPayload } from '../auth.service';
import { User } from '@prisma/client';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  private readonly logger = new Logger(JwtRefreshStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
    });
  }

  async validate(payload: AuthPayload): Promise<Omit<User, 'passwordHash'>> {
    try {
      const user = await this.authService.getUserById(payload.sub);
      
      if (!user) {
        this.logger.warn(`JWT refresh validation failed: User not found (ID: ${payload.sub})`);
        throw new UnauthorizedException('Invalid refresh token: User not found');
      }

      if (!user.isActive) {
        this.logger.warn(`JWT refresh validation failed: User inactive (ID: ${payload.sub})`);
        throw new UnauthorizedException('Account is deactivated');
      }

      this.logger.debug(`JWT refresh validation successful for user: ${user.email} (ID: ${user.id})`);
      return user;
      
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      this.logger.error(`JWT refresh validation error:`, error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}