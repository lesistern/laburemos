import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '@prisma/client';
import { UpdateProfileDto, UpdateFreelancerProfileDto } from './dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.userService.findAll(page, limit);
  }

  @Get('freelancers')
  @ApiOperation({ summary: 'Get freelancers list' })
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10 })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiResponse({ status: 200, description: 'Freelancers retrieved successfully' })
  async findFreelancers(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('categoryId', ParseIntPipe) categoryId?: number,
  ) {
    return this.userService.findFreelancers(page, limit, categoryId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@CurrentUser() user) {
    return user;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get current user statistics' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getUserStats(@CurrentUser('id') userId: number) {
    return this.userService.getUserStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch('profile')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phone: { type: 'string' },
        country: { type: 'string' },
        city: { type: 'string' },
        bio: { type: 'string' },
        profileImage: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(@CurrentUser('id') userId: number, @Body() updateData: UpdateProfileDto) {
    return this.userService.updateProfile(userId, updateData);
  }

  @Patch('freelancer-profile')
  @UseGuards(RolesGuard)
  @Roles(UserType.FREELANCER)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Update freelancer profile (Freelancers only)' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: UpdateFreelancerProfileDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Freelancer profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        userId: { type: 'number' },
        title: { type: 'string' },
        professionalOverview: { type: 'string' },
        skills: { type: 'array', items: { type: 'string' } },
        experienceYears: { type: 'number' },
        availability: { type: 'string', enum: ['FULL_TIME', 'PART_TIME', 'HOURLY', 'NOT_AVAILABLE'] },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'User is not a freelancer' })
  async updateFreelancerProfile(@CurrentUser('id') userId: number, @Body() profileData: UpdateFreelancerProfileDto) {
    return this.userService.updateFreelancerProfile(userId, profileData);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deactivateUser(id);
  }
}