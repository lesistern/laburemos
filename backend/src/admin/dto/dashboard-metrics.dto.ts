import { ApiProperty } from '@nestjs/swagger';

export class DashboardMetricsDto {
  @ApiProperty({ description: 'Real-time platform statistics' })
  realTimeStats: {
    onlineUsers: number;
    activeProjects: number;
    todayRevenue: number;
    newRegistrations: number;
  };

  @ApiProperty({ description: 'Key Performance Indicators' })
  kpis: {
    averageProjectValue: number;
    customerSatisfactionRate: number;
    freelancerRetentionRate: number;
    paymentSuccessRate: number;
  };

  @ApiProperty({ description: 'Recent activity feed', type: 'array', items: { type: 'object' } })
  recentActivity: {
    id: number;
    type: 'user_registration' | 'project_created' | 'project_completed' | 'payment_processed' | 'dispute_created';
    description: string;
    userId?: number;
    userName?: string;
    projectId?: number;
    amount?: number;
    timestamp: Date;
  }[];

  @ApiProperty({ description: 'Top performing freelancers this month', type: 'array', items: { type: 'object' } })
  topFreelancers: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage?: string;
    completedProjects: number;
    totalEarnings: number;
    averageRating: number;
  }[];

  @ApiProperty({ description: 'Most active categories', type: 'array', items: { type: 'object' } })
  popularCategories: {
    id: number;
    name: string;
    icon?: string;
    activeProjects: number;
    totalProjects: number;
    avgProjectValue: number;
  }[];
}

export class SystemHealthDto {
  @ApiProperty({ description: 'Database performance metrics' })
  database: {
    connectionCount: number;
    averageQueryTime: number;
    slowQueries: number;
  };

  @ApiProperty({ description: 'API performance metrics' })
  api: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };

  @ApiProperty({ description: 'Cache performance metrics' })
  cache: {
    hitRate: number;
    memoryUsage: number;
    expiredKeys: number;
  };

  @ApiProperty({ description: 'System alerts and warnings', type: 'array', items: { type: 'object' } })
  alerts: {
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }[];
}