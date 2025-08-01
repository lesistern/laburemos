import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';

export class AnalyticsFiltersDto {
  @ApiPropertyOptional({ description: 'Start date for analytics period (ISO string)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analytics period (ISO string)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Granularity of data', enum: ['day', 'week', 'month', 'year'] })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  granularity?: 'day' | 'week' | 'month' | 'year';

  @ApiPropertyOptional({ description: 'Filter by specific category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by user type', enum: ['CLIENT', 'FREELANCER', 'ADMIN'] })
  @IsOptional()
  @IsEnum(['CLIENT', 'FREELANCER', 'ADMIN'])
  userType?: 'CLIENT' | 'FREELANCER' | 'ADMIN';
}

export class RevenueAnalyticsDto {
  @ApiProperty({ description: 'Total revenue for the period' })
  totalRevenue: number;

  @ApiProperty({ description: 'Revenue growth compared to previous period (percentage)' })
  growthRate: number;

  @ApiProperty({ description: 'Average transaction value' })
  averageTransactionValue: number;

  @ApiProperty({ description: 'Revenue breakdown by time period', type: 'array', items: { type: 'object' } })
  timeSeries: {
    period: string;
    revenue: number;
    transactionCount: number;
    averageValue: number;
  }[];

  @ApiProperty({ description: 'Revenue by category', type: 'array', items: { type: 'object' } })
  byCategory: {
    categoryId: number;
    categoryName: string;
    revenue: number;
    percentage: number;
    projectCount: number;
  }[];

  @ApiProperty({ description: 'Revenue by payment method', type: 'array', items: { type: 'object' } })
  byPaymentMethod: {
    method: string;
    revenue: number;
    percentage: number;
    transactionCount: number;
  }[];

  @ApiProperty({ description: 'Top revenue generating freelancers', type: 'array', items: { type: 'object' } })
  topFreelancers: {
    id: number;
    firstName: string;
    lastName: string;
    revenue: number;
    projectCount: number;
    averageProjectValue: number;
  }[];
}

export class UserAnalyticsDto {
  @ApiProperty({ description: 'User acquisition metrics' })
  acquisition: {
    totalNewUsers: number;
    growthRate: number;
    byUserType: {
      clients: number;
      freelancers: number;
    };
    bySource: {
      organic: number;
      referral: number;
      social: number;
      paid: number;
    };
  };

  @ApiProperty({ description: 'User engagement metrics' })
  engagement: {
    averageSessionDuration: number;
    averageProjectsPerUser: number;
    userRetentionRate: number;
    activeUsersDaily: number;
    activeUsersWeekly: number;
    activeUsersMonthly: number;
  };

  @ApiProperty({ description: 'User activity timeline', type: 'array', items: { type: 'object' } })
  activityTimeline: {
    period: string;
    newRegistrations: number;
    activeUsers: number;
    projectsCreated: number;
    projectsCompleted: number;
  }[];

  @ApiProperty({ description: 'User geographic distribution', type: 'array', items: { type: 'object' } })
  geographicDistribution: {
    country: string;
    city?: string;
    userCount: number;
    percentage: number;
    averageProjectValue: number;
  }[];
}

export class ProjectAnalyticsDto {
  @ApiProperty({ description: 'Project statistics overview' })
  overview: {
    totalProjects: number;
    completedProjects: number;
    activeProjects: number;
    cancelledProjects: number;
    averageCompletionTime: number;
    completionRate: number;
    averageProjectValue: number;
  };

  @ApiProperty({ description: 'Project trends over time', type: 'array', items: { type: 'object' } })
  trends: {
    period: string;
    created: number;
    completed: number;
    cancelled: number;
    averageValue: number;
    completionRate: number;
  }[];

  @ApiProperty({ description: 'Projects by category', type: 'array', items: { type: 'object' } })
  byCategory: {
    categoryId: number;
    categoryName: string;
    totalProjects: number;
    completedProjects: number;
    averageValue: number;
    averageRating: number;
    completionRate: number;
  }[];

  @ApiProperty({ description: 'Project status distribution' })
  statusDistribution: {
    pending: number;
    accepted: number;
    inProgress: number;
    delivered: number;
    completed: number;
    cancelled: number;
    disputed: number;
  };

  @ApiProperty({ description: 'Project value distribution' })
  valueDistribution: {
    under100: number;
    range100to500: number;
    range500to1000: number;
    range1000to5000: number;
    over5000: number;
  };
}

export class PerformanceAnalyticsDto {
  @ApiProperty({ description: 'Platform performance metrics' })
  platform: {
    averageResponseTime: number;
    uptime: number;
    errorRate: number;
    totalRequests: number;
    peakConcurrentUsers: number;
  };

  @ApiProperty({ description: 'Database performance metrics' })
  database: {
    averageQueryTime: number;
    slowQueryCount: number;
    connectionPoolUsage: number;
    transactionRate: number;
  };

  @ApiProperty({ description: 'User experience metrics' })
  userExperience: {
    averagePageLoadTime: number;
    bounceRate: number;
    conversionRate: number;
    customerSatisfactionScore: number;
  };

  @ApiProperty({ description: 'Performance trends over time', type: 'array', items: { type: 'object' } })
  trends: {
    period: string;
    responseTime: number;
    errorRate: number;
    uptime: number;
    userSatisfaction: number;
  }[];
}

export class ExportDataDto {
  @ApiProperty({ description: 'Export format', enum: ['csv', 'excel', 'pdf'] })
  @IsEnum(['csv', 'excel', 'pdf'])
  format: 'csv' | 'excel' | 'pdf';

  @ApiProperty({ description: 'Data type to export', enum: ['users', 'projects', 'revenue', 'analytics'] })
  @IsEnum(['users', 'projects', 'revenue', 'analytics'])
  dataType: 'users' | 'projects' | 'revenue' | 'analytics';

  @ApiPropertyOptional({ description: 'Start date for export data' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for export data' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Additional filters as JSON string' })
  @IsOptional()
  @IsString()
  filters?: string;
}