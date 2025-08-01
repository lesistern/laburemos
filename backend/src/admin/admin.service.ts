import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { 
  AdminStatsResponseDto, 
  PlatformMetricsDto, 
  UserStatsDto,
  DashboardMetricsDto,
  SystemHealthDto,
  AdminUserFiltersDto,
  AdminUserResponseDto,
  UpdateUserStatusDto,
  BulkUserActionDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryFiltersDto,
  CategoryResponseDto,
  CategoryHierarchyDto,
  CategoryAnalyticsDto,
  AnalyticsFiltersDto,
  RevenueAnalyticsDto,
  UserAnalyticsDto,
  UserBehaviorAnalyticsDto,
  ProjectAnalyticsDto,
  PerformanceAnalyticsDto
} from './dto';
import { UserType, ProjectStatus, TransactionStatus } from '@prisma/client';
import { subDays, subMonths, format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // DASHBOARD METRICS
  // =====================================================

  async getDashboardMetrics(): Promise<DashboardMetricsDto> {
    const now = new Date();
    const yesterday = subDays(now, 1);
    const lastMonth = subMonths(now, 1);

    // Real-time stats
    const [
      onlineUsers,
      activeProjects,
      todayRevenue,
      newRegistrations,
      totalUsers,
      completedProjects,
      averageProjectValue
    ] = await Promise.all([
      this.getOnlineUsersCount(),
      this.prisma.project.count({ where: { status: { in: [ProjectStatus.IN_PROGRESS, ProjectStatus.ACCEPTED] } } }),
      this.getTodayRevenue(),
      this.prisma.user.count({ where: { createdAt: { gte: startOfDay(now) } } }),
      this.prisma.user.count(),
      this.prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
      this.getAverageProjectValue()
    ]);

    // KPIs calculation
    const customerSatisfactionRate = await this.calculateCustomerSatisfactionRate();
    const freelancerRetentionRate = await this.calculateFreelancerRetentionRate();
    const paymentSuccessRate = await this.calculatePaymentSuccessRate();

    // Recent activity
    const recentActivity = await this.getRecentActivity();

    // Top performers
    const topFreelancers = await this.getTopFreelancers();

    // Popular categories
    const popularCategories = await this.getPopularCategories();

    return {
      realTimeStats: {
        onlineUsers,
        activeProjects,
        todayRevenue,
        newRegistrations,
      },
      kpis: {
        averageProjectValue,
        customerSatisfactionRate,
        freelancerRetentionRate,
        paymentSuccessRate,
      },
      recentActivity,
      topFreelancers,
      popularCategories,
    };
  }

  async getAdminStats(): Promise<AdminStatsResponseDto> {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));

    const [
      totalUsers,
      newUsersThisMonth,
      activeProjects,
      totalRevenue,
      completedProjects,
      pendingSupportTickets,
      averageCompletionRate,
      lastMonthUsers
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.project.count({ where: { status: { in: [ProjectStatus.IN_PROGRESS, ProjectStatus.ACCEPTED] } } }),
      this.getTotalRevenue(),
      this.prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      this.calculateAverageCompletionRate(),
      this.prisma.user.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } })
    ]);

    const monthlyGrowthRate = lastMonthUsers > 0 
      ? ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100 
      : 0;

    return {
      totalUsers,
      newUsersThisMonth,
      activeProjects,
      totalRevenue,
      completedProjects,
      pendingSupportTickets,
      averageCompletionRate,
      monthlyGrowthRate
    };
  }

  async getPlatformMetrics(): Promise<PlatformMetricsDto> {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const [
      totalFreelancers,
      totalClients,
      activeFreelancers,
      activeClients,
      topCategories,
      monthlyRevenue
    ] = await Promise.all([
      this.prisma.user.count({ where: { userType: UserType.FREELANCER } }),
      this.prisma.user.count({ where: { userType: UserType.CLIENT } }),
      this.prisma.user.count({ 
        where: { 
          userType: UserType.FREELANCER,
          lastLogin: { gte: thirtyDaysAgo }
        } 
      }),
      this.prisma.user.count({ 
        where: { 
          userType: UserType.CLIENT,
          lastLogin: { gte: thirtyDaysAgo }
        } 
      }),
      this.getTopCategories(),
      this.getMonthlyRevenue()
    ]);

    return {
      totalFreelancers,
      totalClients,
      activeFreelancers,
      activeClients,
      topCategories,
      monthlyRevenue
    };
  }

  async getUserStats(): Promise<UserStatsDto> {
    const [registrationTrend, activityDistribution, geographicDistribution] = await Promise.all([
      this.getRegistrationTrend(),
      this.getUserActivityDistribution(),
      this.getGeographicDistribution()
    ]);

    return {
      registrationTrend,
      activityDistribution,
      geographicDistribution
    };
  }

  async getSystemHealth(): Promise<SystemHealthDto> {
    // This would integrate with actual monitoring systems
    return {
      database: {
        connectionCount: 15,
        averageQueryTime: 45,
        slowQueries: 2
      },
      api: {
        requestsPerMinute: 250,
        averageResponseTime: 120,
        errorRate: 0.8
      },
      cache: {
        hitRate: 85.5,
        memoryUsage: 67.3,
        expiredKeys: 23
      },
      alerts: []
    };
  }

  // =====================================================
  // USER MANAGEMENT
  // =====================================================

  async getUsers(filters: AdminUserFiltersDto): Promise<{ users: AdminUserResponseDto[]; total: number; pages: number }> {
    const { page = 1, limit = 20, userType, search, emailVerified, isActive, country, registrationFrom, registrationTo, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    if (userType) where.userType = userType;
    if (emailVerified !== undefined) where.emailVerified = emailVerified;
    if (isActive !== undefined) where.isActive = isActive;
    if (country) where.country = { contains: country, mode: 'insensitive' };
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (registrationFrom || registrationTo) {
      where.createdAt = {};
      if (registrationFrom) where.createdAt.gte = new Date(registrationFrom);
      if (registrationTo) where.createdAt.lte = new Date(registrationTo);
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          freelancerProfile: {
            select: {
              id: true,
              title: true,
              experienceYears: true,
              completionRate: true,
              ratingAverage: true,
              totalReviews: true,
              totalProjects: true,
              totalEarnings: true
            }
          },
          _count: {
            select: {
              clientProjects: true,
              freelancerProjects: true
            }
          }
        }
      }),
      this.prisma.user.count({ where })
    ]);

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const stats = await this.getUserStatistics(user.id);
        return {
          ...user,
          freelancerProfile: user.freelancerProfile ? {
            ...user.freelancerProfile,
            completionRate: user.freelancerProfile.completionRate.toNumber(),
            ratingAverage: user.freelancerProfile.ratingAverage.toNumber(),
            totalEarnings: user.freelancerProfile.totalEarnings.toNumber()
          } : null,
          stats
        };
      })
    );

    return {
      users: enrichedUsers,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  async updateUserStatus(userId: number, updateData: UpdateUserStatusDto): Promise<AdminUserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: updateData.isActive,
        updatedAt: new Date()
      },
      include: {
        freelancerProfile: {
          select: {
            id: true,
            title: true,
            experienceYears: true,
            completionRate: true,
            ratingAverage: true,
            totalReviews: true,
            totalProjects: true,
            totalEarnings: true
          }
        }
      }
    });

    // Log the action
    await this.prisma.activityLog.create({
      data: {
        userId: null, // Admin action
        action: updateData.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: userId,
        metadata: { reason: updateData.reason }
      }
    });

    const stats = await this.getUserStatistics(userId);
    return { 
      ...updatedUser, 
      freelancerProfile: updatedUser.freelancerProfile ? {
        ...updatedUser.freelancerProfile,
        completionRate: updatedUser.freelancerProfile.completionRate.toNumber(),
        ratingAverage: updatedUser.freelancerProfile.ratingAverage.toNumber(),
        totalEarnings: updatedUser.freelancerProfile.totalEarnings.toNumber()
      } : null,
      stats 
    };
  }

  async bulkUserAction(bulkAction: BulkUserActionDto): Promise<{ success: number; failed: number; errors: string[] }> {
    const { userIds, action, reason } = bulkAction;
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        switch (action) {
          case 'activate':
            await this.prisma.user.update({
              where: { id: userId },
              data: { isActive: true }
            });
            break;
          case 'deactivate':
            await this.prisma.user.update({
              where: { id: userId },
              data: { isActive: false }
            });
            break;
          case 'verify_email':
            await this.prisma.user.update({
              where: { id: userId },
              data: { emailVerified: true }
            });
            break;
          case 'delete':
            // Soft delete by deactivating
            await this.prisma.user.update({
              where: { id: userId },
              data: { isActive: false }
            });
            break;
        }

        // Log the action
        await this.prisma.activityLog.create({
          data: {
            userId: null, // Admin action
            action: `BULK_${action.toUpperCase()}`,
            entityType: 'User',
            entityId: userId,
            metadata: { reason }
          }
        });

        success++;
      } catch (error) {
        failed++;
        errors.push(`Usuario ${userId}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }

  // =====================================================
  // CATEGORY MANAGEMENT
  // =====================================================

  async getCategories(filters: CategoryFiltersDto): Promise<{ categories: CategoryResponseDto[]; total: number; pages: number }> {
    const { page = 1, limit = 20, search, parentId, isActive, sortBy = 'displayOrder', sortOrder = 'asc' } = filters;
    
    const skip = (page - 1) * limit;
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (parentId !== undefined) where.parentId = parentId;
    if (isActive !== undefined) where.isActive = isActive;

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          parent: {
            select: { id: true, name: true, slug: true }
          },
          children: {
            select: { id: true, name: true, slug: true, isActive: true },
            include: {
              _count: { select: { services: true } }
            }
          },
          _count: { select: { services: true } }
        }
      }),
      this.prisma.category.count({ where })
    ]);

    const enrichedCategories = await Promise.all(
      categories.map(async (category) => {
        const stats = await this.getCategoryStatistics(category.id);
        return {
          ...category,
          children: category.children.map(child => ({
            ...child,
            serviceCount: child._count.services
          })),
          stats
        };
      })
    );

    return {
      categories: enrichedCategories,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  async createCategory(createData: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Check if slug is unique
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug: createData.slug }
    });
    
    if (existingCategory) {
      throw new BadRequestException('El slug ya está en uso');
    }

    // Check if parent exists
    if (createData.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createData.parentId }
      });
      if (!parent) {
        throw new NotFoundException('Categoría padre no encontrada');
      }
    }

    const category = await this.prisma.category.create({
      data: createData,
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        children: {
          select: { id: true, name: true, slug: true, isActive: true },
          include: {
            _count: { select: { services: true } }
          }
        }
      }
    });

    const stats = await this.getCategoryStatistics(category.id);
    
    return {
      ...category,
      children: category.children.map(child => ({
        ...child,
        serviceCount: child._count.services
      })),
      stats
    };
  }

  async updateCategory(id: number, updateData: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existingCategory = await this.prisma.category.findUnique({ where: { id } });
    if (!existingCategory) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Check slug uniqueness if updating
    if (updateData.slug && updateData.slug !== existingCategory.slug) {
      const slugExists = await this.prisma.category.findUnique({
        where: { slug: updateData.slug }
      });
      if (slugExists) {
        throw new BadRequestException('El slug ya está en uso');
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        children: {
          select: { id: true, name: true, slug: true, isActive: true },
          include: {
            _count: { select: { services: true } }
          }
        }
      }
    });

    const stats = await this.getCategoryStatistics(id);
    
    return {
      ...category,
      children: category.children.map(child => ({
        ...child,
        serviceCount: child._count.services
      })),
      stats
    };
  }

  async deleteCategory(id: number): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { 
        children: true,
        services: true 
      }
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (category.children.length > 0) {
      throw new BadRequestException('No se puede eliminar una categoría con subcategorías');
    }

    if (category.services.length > 0) {
      throw new BadRequestException('No se puede eliminar una categoría con servicios asociados');
    }

    await this.prisma.category.delete({ where: { id } });
  }

  async getCategoryHierarchy(): Promise<CategoryHierarchyDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { displayOrder: 'asc' },
      include: {
        children: {
          orderBy: { displayOrder: 'asc' },
          include: {
            children: {
              orderBy: { displayOrder: 'asc' },
              include: {
                _count: { select: { services: true } }
              }
            },
            _count: { select: { services: true } }
          }
        },
        _count: { select: { services: true } }
      }
    });

    return categories.map(this.mapCategoryHierarchy);
  }

  private mapCategoryHierarchy(category: any): CategoryHierarchyDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      serviceCount: category._count.services,
      children: category.children ? category.children.map(this.mapCategoryHierarchy) : []
    };
  }

  // =====================================================
  // ANALYTICS
  // =====================================================

  async getRevenueAnalytics(filters: AnalyticsFiltersDto): Promise<RevenueAnalyticsDto> {
    const { startDate, endDate, granularity = 'month' } = filters;
    const start = startDate ? new Date(startDate) : subMonths(new Date(), 12);
    const end = endDate ? new Date(endDate) : new Date();

    const [
      totalRevenue,
      previousPeriodRevenue,
      averageTransactionValue,
      timeSeries,
      byCategory,
      byPaymentMethod,
      topFreelancers
    ] = await Promise.all([
      this.getRevenueForPeriod(start, end),
      this.getRevenueForPeriod(this.getPreviousPeriod(start, end), start),
      this.getAverageTransactionValue(start, end),
      this.getRevenueTimeSeries(start, end, granularity),
      this.getRevenueByCategory(start, end),
      this.getRevenueByPaymentMethod(start, end),
      this.getTopRevenueFreelancers(start, end)
    ]);

    const growthRate = previousPeriodRevenue > 0 
      ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      growthRate,
      averageTransactionValue,
      timeSeries,
      byCategory,
      byPaymentMethod,
      topFreelancers
    };
  }

  async getProjectAnalytics(filters: AnalyticsFiltersDto): Promise<ProjectAnalyticsDto> {
    const { startDate, endDate } = filters;
    const start = startDate ? new Date(startDate) : subMonths(new Date(), 12);
    const end = endDate ? new Date(endDate) : new Date();

    // Implementation for project analytics
    const overview = await this.getProjectOverview(start, end);
    const trends = await this.getProjectTrends(start, end);
    const byCategory = await this.getProjectsByCategory(start, end);
    const statusDistribution = await this.getProjectStatusDistribution(start, end);
    const valueDistribution = await this.getProjectValueDistribution(start, end);

    return {
      overview,
      trends,
      byCategory,
      statusDistribution,
      valueDistribution
    };
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private async getOnlineUsersCount(): Promise<number> {
    // This would typically check sessions or use a cache/real-time system
    const fifteenMinutesAgo = subDays(new Date(), 0.01);
    return this.prisma.user.count({
      where: {
        lastLogin: { gte: fifteenMinutesAgo }
      }
    });
  }

  private async getTodayRevenue(): Promise<number> {
    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);

    const result = await this.prisma.transaction.aggregate({
      where: {
        type: 'PAYMENT',
        status: TransactionStatus.COMPLETED,
        createdAt: { gte: startToday, lte: endToday }
      },
      _sum: { amount: true }
    });

    return Number(result._sum.amount) || 0;
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        type: 'PAYMENT',
        status: TransactionStatus.COMPLETED
      },
      _sum: { amount: true }
    });

    return Number(result._sum.amount) || 0;
  }

  private async getAverageProjectValue(): Promise<number> {
    const result = await this.prisma.project.aggregate({
      where: {
        status: ProjectStatus.COMPLETED,
        budget: { not: null }
      },
      _avg: { budget: true }
    });

    return Number(result._avg.budget) || 0;
  }

  private async calculateCustomerSatisfactionRate(): Promise<number> {
    const reviews = await this.prisma.review.aggregate({
      _avg: { rating: true }
    });

    return (Number(reviews._avg.rating) || 0) * 20; // Convert 5-star to percentage
  }

  private async calculateFreelancerRetentionRate(): Promise<number> {
    // Calculate freelancers who completed projects in last 3 months
    const threeMonthsAgo = subMonths(new Date(), 3);
    const activeFreelancers = await this.prisma.user.count({
      where: {
        userType: UserType.FREELANCER,
        freelancerProjects: {
          some: {
            status: ProjectStatus.COMPLETED,
            completedAt: { gte: threeMonthsAgo }
          }
        }
      }
    });

    const totalFreelancers = await this.prisma.user.count({
      where: { userType: UserType.FREELANCER }
    });

    return totalFreelancers > 0 ? (activeFreelancers / totalFreelancers) * 100 : 0;
  }

  private async calculatePaymentSuccessRate(): Promise<number> {
    const totalTransactions = await this.prisma.transaction.count({
      where: { type: 'PAYMENT' }
    });

    const successfulTransactions = await this.prisma.transaction.count({
      where: {
        type: 'PAYMENT',
        status: TransactionStatus.COMPLETED
      }
    });

    return totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
  }

  private async calculateAverageCompletionRate(): Promise<number> {
    const totalProjects = await this.prisma.project.count();
    const completedProjects = await this.prisma.project.count({
      where: { status: ProjectStatus.COMPLETED }
    });

    return totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
  }

  private async getRecentActivity(): Promise<any[]> {
    const activities = await this.prisma.activityLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return activities.map(activity => ({
      id: activity.id,
      type: activity.action.toLowerCase(),
      description: this.formatActivityDescription(activity),
      userId: activity.userId,
      userName: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : null,
      timestamp: activity.createdAt
    }));
  }

  private formatActivityDescription(activity: any): string {
    // Format activity descriptions based on action type
    const actionDescriptions = {
      'USER_REGISTRATION': 'Nuevo usuario registrado',
      'PROJECT_CREATED': 'Nuevo proyecto creado',
      'PROJECT_COMPLETED': 'Proyecto completado',
      'PAYMENT_PROCESSED': 'Pago procesado',
      'DISPUTE_CREATED': 'Disputa creada'
    };

    return actionDescriptions[activity.action] || activity.action;
  }

  private async getTopFreelancers(): Promise<any[]> {
    const freelancers = await this.prisma.user.findMany({
      where: { userType: UserType.FREELANCER },
      include: {
        freelancerProfile: true,
        freelancerProjects: {
          where: { status: ProjectStatus.COMPLETED },
          select: { budget: true }
        }
      },
      take: 5
    });

    return freelancers.map(freelancer => ({
      id: freelancer.id,
      firstName: freelancer.firstName,
      lastName: freelancer.lastName,
      profileImage: freelancer.profileImage,
      completedProjects: freelancer.freelancerProjects.length,
      totalEarnings: freelancer.freelancerProjects.reduce((sum, project) => sum + Number(project.budget || 0), 0),
      averageRating: Number(freelancer.freelancerProfile?.ratingAverage || 0)
    }));
  }

  private async getPopularCategories(): Promise<any[]> {
    const categories = await this.prisma.category.findMany({
      include: {
        services: {
          include: {
            projects: {
              where: { status: { in: [ProjectStatus.IN_PROGRESS, ProjectStatus.ACCEPTED] } }
            }
          }
        }
      },
      take: 10
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      activeProjects: category.services.reduce((sum, service) => sum + service.projects.length, 0),
      totalProjects: category.services.reduce((sum, service) => sum + (service.orderCount || 0), 0),
      avgProjectValue: 0 // Would need to calculate from completed projects
    }));
  }

  private async getTopCategories(): Promise<any[]> {
    return this.getPopularCategories();
  }

  private async getMonthlyRevenue(): Promise<any[]> {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      const revenue = await this.getRevenueForPeriod(start, end);
      const projectCount = await this.prisma.project.count({
        where: {
          status: ProjectStatus.COMPLETED,
          completedAt: { gte: start, lte: end }
        }
      });

      months.push({
        month: format(date, 'yyyy-MM'),
        revenue,
        projectCount
      });
    }
    return months;
  }

  private async getRegistrationTrend(): Promise<any[]> {
    // Implementation for registration trend
    return [];
  }

  private async getUserActivityDistribution(): Promise<any> {
    // Implementation for user activity distribution
    return {
      veryActive: 0,
      active: 0,
      moderate: 0,
      inactive: 0
    };
  }

  private async getGeographicDistribution(): Promise<any[]> {
    const distribution = await this.prisma.user.groupBy({
      by: ['country', 'city'],
      _count: { _all: true },
      where: {
        country: { not: null },
        city: { not: null }
      }
    });

    return distribution.map(item => ({
      country: item.country,
      city: item.city,
      userCount: item._count._all
    }));
  }

  private async getUserStatistics(userId: number): Promise<any> {
    const [clientProjects, freelancerProjects, totalSpent, totalEarned, reviews] = await Promise.all([
      this.prisma.project.count({ where: { clientId: userId } }),
      this.prisma.project.count({ where: { freelancerId: userId } }),
      this.prisma.transaction.aggregate({
        where: { userId, type: 'PAYMENT', status: TransactionStatus.COMPLETED },
        _sum: { amount: true }
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: 'PAYMENT', status: TransactionStatus.COMPLETED },
        _sum: { amount: true }
      }),
      this.prisma.review.aggregate({
        where: { reviewedId: userId },
        _avg: { rating: true },
        _count: { _all: true }
      })
    ]);

    const completedProjects = await this.prisma.project.count({
      where: {
        OR: [
          { clientId: userId, status: ProjectStatus.COMPLETED },
          { freelancerId: userId, status: ProjectStatus.COMPLETED }
        ]
      }
    });

    return {
      projectsAsClient: clientProjects,
      projectsAsFreelancer: freelancerProjects,
      totalSpent: Number(totalSpent._sum.amount) || 0,
      totalEarned: Number(totalEarned._sum.amount) || 0,
      averageRating: Number(reviews._avg.rating) || 0,
      completedProjects
    };
  }

  private async getCategoryStatistics(categoryId: number): Promise<any> {
    const [serviceCount, activeServiceCount, projects, completedProjects, transactions, reviews] = await Promise.all([
      this.prisma.service.count({ where: { categoryId } }),
      this.prisma.service.count({ where: { categoryId, isActive: true } }),
      this.prisma.project.findMany({
        where: {
          service: { categoryId }
        },
        select: { budget: true, status: true }
      }),
      this.prisma.project.count({
        where: {
          service: { categoryId },
          status: ProjectStatus.COMPLETED
        }
      }),
      this.prisma.transaction.aggregate({
        where: {
          project: { service: { categoryId } },
          type: 'PAYMENT',
          status: TransactionStatus.COMPLETED
        },
        _sum: { amount: true }
      }),
      this.prisma.review.aggregate({
        where: {
          project: { service: { categoryId } }
        },
        _avg: { rating: true }
      })
    ]);

    const totalRevenue = Number(transactions._sum.amount) || 0;
    const totalProjects = projects.length;
    const averageProjectValue = totalProjects > 0 ? totalRevenue / totalProjects : 0;

    return {
      serviceCount,
      activeServiceCount,
      totalProjects,
      completedProjects,
      totalRevenue,
      averageProjectValue,
      averageRating: Number(reviews._avg.rating) || 0
    };
  }

  // Helper methods for analytics
  private async getRevenueForPeriod(start: Date, end: Date): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        type: 'PAYMENT',
        status: TransactionStatus.COMPLETED,
        createdAt: { gte: start, lte: end }
      },
      _sum: { amount: true }
    });
    return Number(result._sum.amount) || 0;
  }

  private getPreviousPeriod(start: Date, end: Date): Date {
    const periodLength = end.getTime() - start.getTime();
    return new Date(start.getTime() - periodLength);
  }

  private async getAverageTransactionValue(start: Date, end: Date): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        type: 'PAYMENT',
        status: TransactionStatus.COMPLETED,
        createdAt: { gte: start, lte: end }
      },
      _avg: { amount: true }
    });
    return Number(result._avg.amount) || 0;
  }

  private async getRevenueTimeSeries(start: Date, end: Date, granularity: string): Promise<any[]> {
    // Implementation would depend on granularity
    return [];
  }

  private async getRevenueByCategory(start: Date, end: Date): Promise<any[]> {
    // Implementation for revenue by category
    return [];
  }

  private async getRevenueByPaymentMethod(start: Date, end: Date): Promise<any[]> {
    // Implementation for revenue by payment method
    return [];
  }

  private async getTopRevenueFreelancers(start: Date, end: Date): Promise<any[]> {
    // Implementation for top revenue freelancers
    return [];
  }

  private async getProjectOverview(start: Date, end: Date): Promise<any> {
    // Implementation for project overview
    return {};
  }

  private async getProjectTrends(start: Date, end: Date): Promise<any[]> {
    // Implementation for project trends
    return [];
  }

  private async getProjectsByCategory(start: Date, end: Date): Promise<any[]> {
    // Implementation for projects by category
    return [];
  }

  private async getProjectStatusDistribution(start: Date, end: Date): Promise<any> {
    const projects = await this.prisma.project.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: {
        createdAt: { gte: start, lte: end }
      }
    });

    const distribution = {
      pending: 0,
      accepted: 0,
      inProgress: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      disputed: 0
    };

    projects.forEach(project => {
      const status = project.status.toLowerCase();
      if (status in distribution) {
        distribution[status] = project._count._all;
      }
    });

    return distribution;
  }

  private async getProjectValueDistribution(start: Date, end: Date): Promise<any> {
    // Implementation for project value distribution
    return {
      under100: 0,
      range100to500: 0,
      range500to1000: 0,
      range1000to5000: 0,
      over5000: 0
    };
  }
}