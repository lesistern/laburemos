import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    try {
      const user = await this.authService.validateUser(email, password);
      
      if (!user) {
        this.logger.warn(`Failed login attempt for email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        this.logger.warn(`Login attempt for inactive user: ${email}`);
        throw new UnauthorizedException('Account is deactivated');
      }

      if (!user.emailVerified) {
        this.logger.warn(`Login attempt for unverified user: ${email}`);
        throw new UnauthorizedException('Please verify your email address first');
      }

      this.logger.log(`Successful local authentication for user: ${email}`);
      return user;
      
    } catch (error) {
      this.logger.error(`Local authentication error for ${email}:`, error.message);
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}