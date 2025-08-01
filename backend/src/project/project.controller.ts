import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectStatus } from '@prisma/client';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async create(@Body() createProjectDto: any, @CurrentUser('id') clientId: number) {
    return this.projectService.createProject(createProjectDto, clientId);
  }

  @Get()
  @ApiOperation({ summary: 'Get projects with filters' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query() filters: any,
  ) {
    return this.projectService.findAll(page, limit, filters);
  }

  @Get('my-projects')
  @ApiOperation({ summary: 'Get current user projects' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'User projects retrieved successfully' })
  async getUserProjects(
    @CurrentUser('id') userId: number,
    @CurrentUser('userType') userType: any,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.projectService.getUserProjects(userId, userType, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get project statistics for current user' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Project statistics retrieved successfully' })
  async getProjectStats(
    @CurrentUser('id') userId: number,
    @CurrentUser('userType') userType: any,
  ) {
    return this.projectService.getProjectStats(userId, userType);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('userType') userType: any,
  ) {
    return this.projectService.findOne(id, userId, userType);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update project status' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Project status updated successfully' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ProjectStatus,
    @CurrentUser('id') userId: number,
    @CurrentUser('userType') userType: any,
  ) {
    return this.projectService.updateStatus(id, status, userId, userType);
  }
}