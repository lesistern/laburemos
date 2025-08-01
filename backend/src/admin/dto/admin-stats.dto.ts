import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsResponseDto {
  @ApiProperty({ description: 'Total number of users', example: 1250 })
  totalUsers: number;

  @ApiProperty({ description: 'Number of new users this month', example: 85 })
  newUsersThisMonth: number;

  @ApiProperty({ description: 'Total number of active projects', example: 342 })
  activeProjects: number;

  @ApiProperty({ description: 'Total revenue in ARS', example: 125000.50 })
  totalRevenue: number;

  @ApiProperty({ description: 'Number of completed projects', example: 890 })
  completedProjects: number;

  @ApiProperty({ description: 'Number of pending support tickets', example: 12 })
  pendingSupportTickets: number;

  @ApiProperty({ description: 'Average project completion rate as percentage', example: 87.5 })
  averageCompletionRate: number;

  @ApiProperty({ description: 'Platform growth rate this month as percentage', example: 12.3 })
  monthlyGrowthRate: number;
}

export class PlatformMetricsDto {
  @ApiProperty({ description: 'Total freelancers count', example: 750 })
  totalFreelancers: number;

  @ApiProperty({ description: 'Total clients count', example: 500 })
  totalClients: number;

  @ApiProperty({ description: 'Active freelancers (last 30 days)', example: 450 })
  activeFreelancers: number;

  @ApiProperty({ description: 'Active clients (last 30 days)', example: 320 })
  activeClients: number;

  @ApiProperty({ description: 'Top performing categories', type: 'array', items: { type: 'object' } })
  topCategories: {
    id: number;
    name: string;
    projectCount: number;
    revenue: number;
  }[];

  @ApiProperty({ description: 'Revenue by month for the last 12 months', type: 'array', items: { type: 'object' } })
  monthlyRevenue: {
    month: string;
    revenue: number;
    projectCount: number;
  }[];
}

export class UserStatsDto {
  @ApiProperty({ description: 'User registration trend', type: 'array', items: { type: 'object' } })
  registrationTrend: {
    date: string;
    count: number;
    userType: string;
  }[];

  @ApiProperty({ description: 'User activity distribution', type: 'object' })
  activityDistribution: {
    veryActive: number; // Projects > 10
    active: number;     // Projects 3-10
    moderate: number;   // Projects 1-2
    inactive: number;   // No projects
  };

  @ApiProperty({ description: 'Geographic distribution of users', type: 'array', items: { type: 'object' } })
  geographicDistribution: {
    country: string;
    city: string;
    userCount: number;
  }[];
}