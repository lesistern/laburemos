import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Patch,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('api/auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        success: true,
        data: {
          status: 'healthy',
          timestamp: '2024-01-01T00:00:00.000Z',
          version: '1.0.0',
          database: 'connected'
        },
        statusCode: 200
      }
    }
  })
  async healthCheck() {
    return this.authService.healthCheck();
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'user@example.com',
            userType: 'CLIENT',
            firstName: 'John',
            lastName: 'Doe',
            emailVerified: false,
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        statusCode: 201,
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/register',
        method: 'POST'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or user already exists',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: 'User with this email already exists',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/register',
        method: 'POST'
      }
    }
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    schema: {
      example: {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'user@example.com',
            userType: 'CLIENT',
            firstName: 'John',
            lastName: 'Doe',
            emailVerified: true,
            isActive: true,
            lastLogin: '2024-01-01T00:00:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        statusCode: 200,
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/login',
        method: 'POST'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/login',
        method: 'POST'
      }
    }
  })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(loginDto);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Access token successfully refreshed',
    schema: {
      example: {
        success: true,
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        statusCode: 200,
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/refresh',
        method: 'POST'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid refresh token',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/refresh',
        method: 'POST'
      }
    }
  })
  async refresh(@Request() req) {
    const refreshToken = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
    schema: {
      example: {
        success: true,
        data: {
          message: 'Successfully logged out'
        },
        statusCode: 200,
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/logout',
        method: 'POST'
      }
    }
  })
  async logout(@CurrentUser('id') userId: number, @Request() req) {
    const refreshToken = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 1,
          email: 'user@example.com',
          userType: 'CLIENT',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          country: 'Argentina',
          city: 'Buenos Aires',
          emailVerified: true,
          phoneVerified: false,
          identityVerified: false,
          isActive: true,
          lastLogin: '2024-01-01T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        statusCode: 200,
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/profile',
        method: 'GET'
      }
    }
  })
  async getProfile(@CurrentUser() user) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Password successfully changed',
    schema: {
      example: {
        success: true,
        data: {
          message: 'Password changed successfully'
        },
        statusCode: 200,
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/change-password',
        method: 'PATCH'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Current password is incorrect',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/change-password',
        method: 'PATCH'
      }
    }
  })
  async changePassword(
    @CurrentUser('id') userId: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if user exists',
    schema: {
      example: {
        success: true,
        data: {
          message: 'If the email exists, a reset link has been sent'
        },
        statusCode: 200,
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/forgot-password',
        method: 'POST'
      }
    }
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password successfully reset',
    schema: {
      example: {
        success: true,
        data: {
          message: 'Password reset successfully'
        },
        statusCode: 200,
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/reset-password',
        method: 'POST'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid or expired reset token',
        timestamp: '2024-01-01T00:00:00.000Z',
        path: '/api/v1/auth/reset-password',
        method: 'POST'
      }
    }
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}