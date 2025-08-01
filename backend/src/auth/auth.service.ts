import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserType } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { TokenService } from './token.service';
import { PasswordService } from './password.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface AuthPayload {
  sub: number;
  email: string;
  userType: UserType;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private tokenService: TokenService,
    private passwordService: PasswordService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName, userType, ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate password strength
    this.passwordService.validatePasswordStrength(password);

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(password);

    try {
      // Create user with transaction
      const user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
            userType: userType || UserType.CLIENT,
            ...userData,
          },
        });

        // Create wallet for new user
        await tx.wallet.create({
          data: {
            userId: newUser.id,
          },
        });

        // Create freelancer profile if user is freelancer
        if (newUser.userType === UserType.FREELANCER) {
          await tx.freelancerProfile.create({
            data: {
              userId: newUser.id,
            },
          });
        }

        return newUser;
      });

      this.logger.log(`New user registered: ${user.email} (ID: ${user.id})`);

      return this.generateAuthResponse(user);
    } catch (error) {
      this.logger.error('Registration failed:', error);
      throw new BadRequestException('Failed to create user account');
    }
  }

  /**
   * Login user with email and password
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    this.logger.log(`User logged in: ${user.email} (ID: ${user.id})`);

    return this.generateAuthResponse(user);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      
      // Check if refresh token exists in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.isRevoked || new Date() > storedToken.expiresAt) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = await this.tokenService.generateAccessToken({
        sub: storedToken.user.id,
        email: storedToken.user.email,
        userType: storedToken.user.userType,
      });

      return { accessToken };
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user and revoke tokens
   */
  async logout(userId: number, refreshToken?: string): Promise<{ message: string }> {
    try {
      // Revoke all refresh tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      // Remove user sessions from Redis
      await this.redis.del(`user_session:${userId}`);
      
      // Add access token to blacklist (if provided)
      if (refreshToken) {
        await this.redis.set(
          `blacklisted_token:${refreshToken}`,
          'true',
          7 * 24 * 60 * 60, // 7 days
        );
      }

      this.logger.log(`User logged out: ${userId}`);

      return { message: 'Successfully logged out' };
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw new BadRequestException('Failed to logout');
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.comparePasswords(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password strength
    this.passwordService.validatePasswordStrength(newPassword);

    // Hash new password
    const newPasswordHash = await this.passwordService.hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all refresh tokens to force re-login
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Password changed for user: ${user.email} (ID: ${userId})`);

    return { message: 'Password changed successfully' };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = await this.tokenService.generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // TODO: Send email with reset link
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    this.logger.log(`Password reset requested for user: ${email}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    // Find valid reset token
    const resetToken = await this.prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate new password strength
    this.passwordService.validatePasswordStrength(newPassword);

    // Hash new password
    const passwordHash = await this.passwordService.hashPassword(newPassword);

    // Update password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Password reset completed for user: ${resetToken.user.email}`);

    return { message: 'Password reset successfully' };
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        return null;
      }

      const isPasswordValid = await this.passwordService.comparePasswords(
        password,
        user.passwordHash,
      );

      return isPasswordValid ? user : null;
    } catch (error) {
      this.logger.error('User validation failed:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<Omit<User, 'passwordHash'> | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return null;
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error('Get user by ID failed:', error);
      return null;
    }
  }

  /**
   * Check if user has required role
   */
  hasRole(user: User, requiredRoles: UserType[]): boolean {
    return requiredRoles.includes(user.userType);
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Test Redis connection
      await this.redis.ping();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: 'connected',
        redis: 'connected',
        uptime: process.uptime(),
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw new Error('Service unhealthy');
    }
  }

  /**
   * Generate authentication response with tokens
   */
  private async generateAuthResponse(user: User): Promise<AuthResponse> {
    const payload: AuthPayload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken(payload),
      this.tokenService.generateRefreshToken(payload),
    ]);

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        ),
      },
    });

    // Store user session in Redis
    await this.redis.setSession(`user_session:${user.id}`, {
      userId: user.id,
      email: user.email,
      userType: user.userType,
      lastActivity: new Date().toISOString(),
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }
}