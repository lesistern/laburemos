import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { User, FreelancerProfile } from '@prisma/client';
import { UpdateProfileDto, UpdateFreelancerProfileDto } from './dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          profileImage: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: number): Promise<Omit<User, 'passwordHash'> | null> {
    const cacheKey = `user:${id}`;
    
    // Try cache first
    const cached = await this.redis.getJson<Omit<User, 'passwordHash'>>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        userType: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        city: true,
        stateProvince: true,
        postalCode: true,
        address: true,
        dniCuit: true,
        profileImage: true,
        bio: true,
        hourlyRate: true,
        currency: true,
        language: true,
        timezone: true,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user) {
      // Cache for 5 minutes
      await this.redis.setJson(cacheKey, user, 300);
    }

    return user;
  }

  async findFreelancers(page: number = 1, limit: number = 10, categoryId?: number) {
    const skip = (page - 1) * limit;
    
    const where = {
      userType: 'FREELANCER' as const,
      isActive: true,
      freelancerProfile: {
        isNot: null,
      },
      ...(categoryId && {
        services: {
          some: {
            categoryId,
            isActive: true,
          },
        },
      }),
    };

    const [freelancers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          freelancerProfile: true,
          services: {
            where: { isActive: true },
            take: 3,
            include: { category: true },
          },
        },
        orderBy: {
          freelancerProfile: {
            ratingAverage: 'desc',
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: freelancers.map(user => ({
        ...user,
        passwordHash: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async updateProfile(id: number, updateData: UpdateProfileDto) {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, isActive: true }
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      if (!existingUser.isActive) {
        throw new BadRequestException('Cannot update profile of inactive user');
      }

      // Clean the data - remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(cleanedData).length === 0) {
        throw new BadRequestException('No valid fields to update');
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: cleanedData,
        select: {
          id: true,
          email: true,
          userType: true,
          firstName: true,
          lastName: true,
          phone: true,
          country: true,
          city: true,
          stateProvince: true,
          postalCode: true,
          address: true,
          dniCuit: true,
          profileImage: true,
          bio: true,
          hourlyRate: true,
          currency: true,
          language: true,
          timezone: true,
          emailVerified: true,
          phoneVerified: true,
          identityVerified: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Update cache
      await this.redis.setJson(`user:${id}`, user, 300);
      
      this.logger.log(`User profile updated: ${user.email} (ID: ${id})`);
      
      return {
        success: true,
        message: 'Profile updated successfully',
        data: user
      };
    } catch (error) {
      this.logger.error(`Failed to update user profile (ID: ${id}): ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to update profile');
    }
  }

  async updateFreelancerProfile(userId: number, profileData: UpdateFreelancerProfileDto) {
    try {
      // Check if user exists and is a freelancer
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, userType: true, isActive: true }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (user.userType !== 'FREELANCER') {
        throw new BadRequestException('User is not a freelancer');
      }

      if (!user.isActive) {
        throw new BadRequestException('Cannot update profile of inactive user');
      }

      // Clean the data - remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(cleanedData).length === 0) {
        throw new BadRequestException('No valid fields to update');
      }

      const profile = await this.prisma.freelancerProfile.upsert({
        where: { userId },
        update: cleanedData,
        create: {
          userId,
          ...cleanedData,
        },
        select: {
          id: true,
          userId: true,
          title: true,
          professionalOverview: true,
          skills: true,
          experienceYears: true,
          education: true,
          certifications: true,
          portfolioItems: true,
          availability: true,
          responseTime: true,
          completionRate: true,
          onTimeRate: true,
          ratingAverage: true,
          totalReviews: true,
          totalProjects: true,
          totalEarnings: true,
          profileViews: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Clear user cache
      await this.redis.del(`user:${userId}`);
      
      this.logger.log(`Freelancer profile updated for user ID: ${userId}`);
      
      return {
        success: true,
        message: 'Freelancer profile updated successfully',
        data: profile
      };
    } catch (error) {
      this.logger.error(`Failed to update freelancer profile (user ID: ${userId}): ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to update freelancer profile');
    }
  }

  async deactivateUser(id: number) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Clear cache
    await this.redis.del(`user:${id}`);
    
    this.logger.log(`User deactivated: ${user.email} (ID: ${id})`);
    
    return { message: 'User deactivated successfully' };
  }

  async getUserStats(userId: number) {
    const cacheKey = `user_stats:${userId}`;
    
    // Try cache first
    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        freelancerProfile: true,
        wallet: true,
        _count: {
          select: {
            clientProjects: true,
            freelancerProjects: true,
            services: true,
            reviewsGiven: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = {
      profileCompletion: this.calculateProfileCompletion(user),
      totalProjects: user._count.clientProjects + user._count.freelancerProjects,
      activeServices: user._count.services,
      reviewsGiven: user._count.reviewsGiven,
      reviewsReceived: user._count.reviewsReceived,
      walletBalance: user.wallet?.balance || 0,
      memberSince: user.createdAt,
      ...(user.freelancerProfile && {
        freelancerStats: {
          rating: user.freelancerProfile.ratingAverage,
          totalEarnings: user.freelancerProfile.totalEarnings,
          completionRate: user.freelancerProfile.completionRate,
          onTimeRate: user.freelancerProfile.onTimeRate,
          responseTime: user.freelancerProfile.responseTime,
        },
      }),
    };

    // Cache for 10 minutes
    await this.redis.setJson(cacheKey, stats, 600);
    
    return stats;
  }

  private calculateProfileCompletion(user: User & { freelancerProfile?: FreelancerProfile }): number {
    const requiredFields = [
      'firstName',
      'lastName',
      'phone',
      'country',
      'city',
      'bio',
      'profileImage',
    ];

    const freelancerFields = [
      'title',
      'professionalOverview',
      'skills',
      'experienceYears',
    ];

    let completedFields = 0;
    let totalFields = requiredFields.length;

    // Check basic user fields
    requiredFields.forEach(field => {
      if (user[field]) completedFields++;
    });

    // Check freelancer specific fields
    if (user.userType === 'FREELANCER' && user.freelancerProfile) {
      totalFields += freelancerFields.length;
      freelancerFields.forEach(field => {
        if (user.freelancerProfile[field]) completedFields++;
      });
    }

    return Math.round((completedFields / totalFields) * 100);
  }
}