import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, IsBoolean, IsEmail, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserType } from '@prisma/client';

export class AdminUserFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by user type', enum: UserType })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by verification status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  emailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Filter by registration date from' })
  @IsOptional()
  @IsDateString()
  registrationFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by registration date to' })
  @IsOptional()
  @IsDateString()
  registrationTo?: string;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['createdAt', 'lastLogin', 'firstName', 'totalEarnings'] })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}

export class AdminUserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'First name', nullable: true })
  firstName: string | null;

  @ApiProperty({ description: 'Last name', nullable: true })
  lastName: string | null;

  @ApiProperty({ description: 'User type', enum: UserType })
  userType: UserType;

  @ApiProperty({ description: 'Phone number', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Country', nullable: true })
  country: string | null;

  @ApiProperty({ description: 'City', nullable: true })
  city: string | null;

  @ApiProperty({ description: 'Profile image URL', nullable: true })
  profileImage: string | null;

  @ApiProperty({ description: 'Email verification status' })
  emailVerified: boolean;

  @ApiProperty({ description: 'Phone verification status' })
  phoneVerified: boolean;

  @ApiProperty({ description: 'Identity verification status' })
  identityVerified: boolean;

  @ApiProperty({ description: 'Account active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp', nullable: true })
  lastLogin: Date | null;

  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Account last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Freelancer profile data if user is freelancer', nullable: true })
  freelancerProfile?: {
    id: number;
    title: string | null;
    experienceYears: number;
    completionRate: number;
    ratingAverage: number;
    totalReviews: number;
    totalProjects: number;
    totalEarnings: number;
  } | null;

  @ApiProperty({ description: 'User statistics' })
  stats: {
    projectsAsClient: number;
    projectsAsFreelancer: number;
    totalSpent: number;
    totalEarned: number;
    averageRating: number;
    completedProjects: number;
  };
}

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'New active status' })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkUserActionDto {
  @ApiProperty({ description: 'Array of user IDs to apply action to', type: [Number] })
  userIds: number[];

  @ApiProperty({ description: 'Action to perform', enum: ['activate', 'deactivate', 'verify_email', 'delete'] })
  @IsEnum(['activate', 'deactivate', 'verify_email', 'delete'])
  action: 'activate' | 'deactivate' | 'verify_email' | 'delete';

  @ApiPropertyOptional({ description: 'Reason for bulk action' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UserBehaviorAnalyticsDto {
  @ApiProperty({ description: 'User behavior analytics' })
  behavior: {
    avgSessionDuration: number;
    avgProjectsPerMonth: number;
    mostActiveHours: number[];
    deviceDistribution: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
  };

  @ApiProperty({ description: 'User conversion funnel' })
  conversion: {
    registrations: number;
    profileCompleted: number;
    firstProject: number;
    completedProject: number;
    repeatClients: number;
  };

  @ApiProperty({ description: 'User retention metrics' })
  retention: {
    day1: number;
    day7: number;
    day30: number;
    day90: number;
  };
}