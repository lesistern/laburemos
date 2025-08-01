import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserType } from '@prisma/client';
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
  ProjectAnalyticsDto,
  PerformanceAnalyticsDto
} from './dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserType.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // =====================================================
  // DASHBOARD ENDPOINTS
  // =====================================================

  @Get('dashboard/metrics')
  @ApiOperation({ summary: 'Get dashboard metrics for admin panel' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard metrics retrieved successfully',
    type: DashboardMetricsDto
  })
  @ApiResponse({ status: 403, description: 'Access denied - Admin role required' })
  async getDashboardMetrics(): Promise<DashboardMetricsDto> {
    return this.adminService.getDashboardMetrics();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get general admin statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Admin statistics retrieved successfully',
    type: AdminStatsResponseDto
  })
  async getAdminStats(): Promise<AdminStatsResponseDto> {
    return this.adminService.getAdminStats();
  }

  @Get('platform/metrics')
  @ApiOperation({ summary: 'Get platform-wide metrics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Platform metrics retrieved successfully',
    type: PlatformMetricsDto
  })
  async getPlatformMetrics(): Promise<PlatformMetricsDto> {
    return this.adminService.getPlatformMetrics();
  }

  @Get('users/stats')
  @ApiOperation({ summary: 'Get user statistics and trends' })
  @ApiResponse({ 
    status: 200, 
    description: 'User statistics retrieved successfully',
    type: UserStatsDto
  })
  async getUserStats(): Promise<UserStatsDto> {
    return this.adminService.getUserStats();
  }

  @Get('system/health')
  @ApiOperation({ summary: 'Get system health metrics' })
  @ApiResponse({ 
    status: 200, 
    description: 'System health retrieved successfully',
    type: SystemHealthDto
  })
  async getSystemHealth(): Promise<SystemHealthDto> {
    return this.adminService.getSystemHealth();
  }

  // =====================================================
  // USER MANAGEMENT ENDPOINTS
  // =====================================================

  @Get('users')
  @ApiOperation({ summary: 'Get all users with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        users: { type: 'array', items: { $ref: '#/components/schemas/AdminUserResponseDto' } },
        total: { type: 'number' },
        pages: { type: 'number' }
      }
    }
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getUsers(@Query() filters: AdminUserFiltersDto) {
    return this.adminService.getUsers(filters);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user status (activate/deactivate)' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User status updated successfully',
    type: AdminUserResponseDto
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateUserStatusDto
  ): Promise<AdminUserResponseDto> {
    return this.adminService.updateUserStatus(id, updateData);
  }

  @Post('users/bulk-action')
  @ApiOperation({ summary: 'Perform bulk action on multiple users' })
  @ApiBody({ type: BulkUserActionDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk action completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', description: 'Number of successful operations' },
        failed: { type: 'number', description: 'Number of failed operations' },
        errors: { type: 'array', items: { type: 'string' }, description: 'List of error messages' }
      }
    }
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async bulkUserAction(@Body() bulkAction: BulkUserActionDto) {
    return this.adminService.bulkUserAction(bulkAction);
  }

  // =====================================================
  // CATEGORY MANAGEMENT ENDPOINTS
  // =====================================================

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Categories retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        categories: { type: 'array', items: { $ref: '#/components/schemas/CategoryResponseDto' } },
        total: { type: 'number' },
        pages: { type: 'number' }
      }
    }
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getCategories(@Query() filters: CategoryFiltersDto) {
    return this.adminService.getCategories(filters);
  }

  @Get('categories/hierarchy')
  @ApiOperation({ summary: 'Get complete category hierarchy tree' })
  @ApiResponse({ 
    status: 200, 
    description: 'Category hierarchy retrieved successfully',
    type: [CategoryHierarchyDto]
  })
  async getCategoryHierarchy(): Promise<CategoryHierarchyDto[]> {
    return this.adminService.getCategoryHierarchy();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Category created successfully',
    type: CategoryResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or slug already exists' })
  @ApiResponse({ status: 404, description: 'Parent category not found' })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createCategory(@Body() createData: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.adminService.createCategory(createData);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiParam({ name: 'id', description: 'Category ID', type: 'number' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Category updated successfully',
    type: CategoryResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or slug already exists' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: UpdateCategoryDto
  ): Promise<CategoryResponseDto> {
    return this.adminService.updateCategory(id, updateData);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category (only if no children or services)' })
  @ApiParam({ name: 'id', description: 'Category ID', type: 'number' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete category with children or services' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.adminService.deleteCategory(id);
  }

  // =====================================================
  // ANALYTICS ENDPOINTS
  // =====================================================

  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue analytics with filtering' })
  @ApiResponse({ 
    status: 200, 
    description: 'Revenue analytics retrieved successfully',
    type: RevenueAnalyticsDto
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getRevenueAnalytics(@Query() filters: AnalyticsFiltersDto): Promise<RevenueAnalyticsDto> {
    return this.adminService.getRevenueAnalytics(filters);
  }

  @Get('analytics/users')
  @ApiOperation({ summary: 'Get user analytics and behavior data' })
  @ApiResponse({ 
    status: 200, 
    description: 'User analytics retrieved successfully',
    type: UserAnalyticsDto
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getUserAnalytics(@Query() filters: AnalyticsFiltersDto): Promise<UserAnalyticsDto> {
    // This would call a different method in the service
    return {} as UserAnalyticsDto; // Placeholder
  }

  @Get('analytics/projects')
  @ApiOperation({ summary: 'Get project analytics and trends' })
  @ApiResponse({ 
    status: 200, 
    description: 'Project analytics retrieved successfully',
    type: ProjectAnalyticsDto
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getProjectAnalytics(@Query() filters: AnalyticsFiltersDto): Promise<ProjectAnalyticsDto> {
    return this.adminService.getProjectAnalytics(filters);
  }

  @Get('analytics/performance')
  @ApiOperation({ summary: 'Get platform performance analytics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Performance analytics retrieved successfully',
    type: PerformanceAnalyticsDto
  })
  async getPerformanceAnalytics(): Promise<PerformanceAnalyticsDto> {
    // This would be implemented in the service
    return {} as PerformanceAnalyticsDto; // Placeholder
  }

  // =====================================================
  // SUPPORT & TICKETS ENDPOINTS
  // =====================================================

  @Get('support/tickets')
  @ApiOperation({ summary: 'Get all support tickets with filtering' })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Support tickets retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        tickets: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
        pages: { type: 'number' }
      }
    }
  })
  async getSupportTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20
  ) {
    // Implementation would be in the service
    return {
      tickets: [],
      total: 0,
      pages: 0
    };
  }

  @Patch('support/tickets/:id/assign')
  @ApiOperation({ summary: 'Assign support ticket to admin user' })
  @ApiParam({ name: 'id', description: 'Ticket ID', type: 'number' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        assignedTo: { type: 'number', description: 'Admin user ID to assign ticket to' }
      },
      required: ['assignedTo']
    }
  })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async assignTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body('assignedTo', ParseIntPipe) assignedTo: number
  ) {
    // Implementation would be in the service
    return { message: 'Ticket assigned successfully' };
  }

  @Patch('support/tickets/:id/status')
  @ApiOperation({ summary: 'Update support ticket status' })
  @ApiParam({ name: 'id', description: 'Ticket ID', type: 'number' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['OPEN', 'PENDING', 'RESOLVED', 'CLOSED'] },
        resolution: { type: 'string', description: 'Resolution notes' }
      },
      required: ['status']
    }
  })
  @ApiResponse({ status: 200, description: 'Ticket status updated successfully' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async updateTicketStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: { status: string; resolution?: string }
  ) {
    // Implementation would be in the service
    return { message: 'Ticket status updated successfully' };
  }

  // =====================================================
  // SYSTEM CONFIGURATION ENDPOINTS
  // =====================================================

  @Get('config/system')
  @ApiOperation({ summary: 'Get system configuration settings' })
  @ApiResponse({ 
    status: 200, 
    description: 'System configuration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        platformName: { type: 'string' },
        maintenanceMode: { type: 'boolean' },
        registrationEnabled: { type: 'boolean' },
        emailNotifications: { type: 'boolean' },
        paymentGateways: { type: 'array', items: { type: 'string' } },
        supportedCurrencies: { type: 'array', items: { type: 'string' } },
        maxFileUploadSize: { type: 'number' },
        sessionTimeout: { type: 'number' }
      }
    }
  })
  async getSystemConfig() {
    // Implementation would fetch from database or config
    return {
      platformName: 'LaburAR',
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotifications: true,
      paymentGateways: ['stripe', 'mercadopago'],
      supportedCurrencies: ['ARS', 'USD'],
      maxFileUploadSize: 10485760, // 10MB
      sessionTimeout: 3600000 // 1 hour
    };
  }

  @Patch('config/system')
  @ApiOperation({ summary: 'Update system configuration settings' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        platformName: { type: 'string' },
        maintenanceMode: { type: 'boolean' },
        registrationEnabled: { type: 'boolean' },
        emailNotifications: { type: 'boolean' },
        maxFileUploadSize: { type: 'number' },
        sessionTimeout: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'System configuration updated successfully' })
  async updateSystemConfig(@Body() configData: any) {
    // Implementation would update database or config
    return { message: 'System configuration updated successfully' };
  }

  @Post('system/maintenance')
  @ApiOperation({ summary: 'Enable/disable maintenance mode' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        message: { type: 'string', description: 'Maintenance message to display' },
        estimatedDuration: { type: 'number', description: 'Estimated duration in minutes' }
      },
      required: ['enabled']
    }
  })
  @ApiResponse({ status: 200, description: 'Maintenance mode updated successfully' })
  async updateMaintenanceMode(@Body() maintenanceData: any) {
    // Implementation would update maintenance mode
    return { message: 'Maintenance mode updated successfully' };
  }

  // =====================================================
  // EXPORT & REPORTS ENDPOINTS
  // =====================================================

  @Post('export/users')
  @ApiOperation({ summary: 'Export users data to CSV/Excel' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['csv', 'excel'] },
        filters: { type: 'object', description: 'User filters to apply' }
      },
      required: ['format']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Export file generated successfully',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string' },
        fileName: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  async exportUsers(@Body() exportData: any) {
    // Implementation would generate export file
    return {
      downloadUrl: '/api/admin/downloads/users-export-2024.csv',
      fileName: 'users-export-2024.csv',
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
    };
  }

  @Post('export/revenue')
  @ApiOperation({ summary: 'Export revenue data to CSV/Excel' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['csv', 'excel'] },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        groupBy: { type: 'string', enum: ['day', 'week', 'month'] }
      },
      required: ['format']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Revenue export file generated successfully',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string' },
        fileName: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  async exportRevenue(@Body() exportData: any) {
    // Implementation would generate revenue export
    return {
      downloadUrl: '/api/admin/downloads/revenue-export-2024.csv',
      fileName: 'revenue-export-2024.csv',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };
  }

  @Get('reports/monthly')
  @ApiOperation({ summary: 'Generate monthly platform report' })
  @ApiQuery({ name: 'year', required: false, type: 'number' })
  @ApiQuery({ name: 'month', required: false, type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Monthly report generated successfully',
    schema: {
      type: 'object',
      properties: {
        period: { type: 'string' },
        summary: { type: 'object' },
        userMetrics: { type: 'object' },
        revenueMetrics: { type: 'object' },
        projectMetrics: { type: 'object' },
        topPerformers: { type: 'object' }
      }
    }
  })
  async getMonthlyReport(
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number
  ) {
    // Implementation would generate comprehensive monthly report
    const currentDate = new Date();
    const reportYear = year || currentDate.getFullYear();
    const reportMonth = month || currentDate.getMonth() + 1;

    return {
      period: `${reportYear}-${reportMonth.toString().padStart(2, '0')}`,
      summary: {
        totalUsers: 1250,
        newUsers: 85,
        totalRevenue: 125000,
        completedProjects: 342
      },
      userMetrics: {
        registrations: 85,
        retention: 78.5,
        engagement: 65.2
      },
      revenueMetrics: {
        total: 125000,
        growth: 12.3,
        averageTransactionValue: 365.85
      },
      projectMetrics: {
        created: 425,
        completed: 342,
        completionRate: 80.5
      },
      topPerformers: {
        freelancers: [],
        categories: [],
        clients: []
      }
    };
  }
}