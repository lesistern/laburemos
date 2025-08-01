import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { Project, ProjectStatus, UserType, Prisma } from '@prisma/client';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async createProject(data: any, clientId: number) {
    const project = await this.prisma.project.create({
      data: {
        ...data,
        clientId,
        status: ProjectStatus.PENDING,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            basePrice: true,
          },
        },
      },
    });

    this.logger.log(`Project created: ${project.title} (ID: ${project.id})`);
    return project;
  }

  async findAll(page: number = 1, limit: number = 10, filters: any = {}) {
    const skip = (page - 1) * limit;
    
    const where = {
      ...(filters.status && { status: filters.status }),
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.freelancerId && { freelancerId: filters.freelancerId }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search } },
          { description: { contains: filters.search } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          freelancer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: projects,
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

  async findOne(id: number, userId: number, userType: UserType) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        freelancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            freelancerProfile: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            basePrice: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        milestones: true,
        messages: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check permissions
    if (userType !== UserType.ADMIN && 
        project.clientId !== userId && 
        project.freelancerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return project;
  }

  async updateStatus(id: number, status: ProjectStatus, userId: number, userType: UserType) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check permissions
    if (userType !== UserType.ADMIN && 
        project.clientId !== userId && 
        project.freelancerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: { 
        status,
        ...(status === ProjectStatus.IN_PROGRESS && { startedAt: new Date() }),
        ...(status === ProjectStatus.DELIVERED && { deliveredAt: new Date() }),
        ...(status === ProjectStatus.COMPLETED && { completedAt: new Date() }),
        ...(status === ProjectStatus.CANCELLED && { cancelledAt: new Date() }),
      },
    });

    this.logger.log(`Project status updated: ${project.title} (ID: ${id}) -> ${status}`);
    return updatedProject;
  }

  async getUserProjects(userId: number, userType: UserType, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const where = userType === UserType.CLIENT 
      ? { clientId: userId }
      : { freelancerId: userId };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          freelancer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: projects,
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

  async getProjectStats(userId: number, userType: UserType) {
    const cacheKey = `project_stats:${userId}:${userType}`;
    
    // Try cache first
    const cached = await this.redis.getJson(cacheKey);
    if (cached) {
      return cached;
    }

    const where = userType === UserType.CLIENT 
      ? { clientId: userId }
      : { freelancerId: userId };

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      cancelledProjects,
      averageRating,
    ] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.count({ 
        where: { ...where, status: { in: [ProjectStatus.PENDING, ProjectStatus.ACCEPTED, ProjectStatus.IN_PROGRESS] } }
      }),
      this.prisma.project.count({ 
        where: { ...where, status: ProjectStatus.COMPLETED }
      }),
      this.prisma.project.count({ 
        where: { ...where, status: ProjectStatus.CANCELLED }
      }),
      this.prisma.project.aggregate({
        where: { 
          ...where, 
          status: ProjectStatus.COMPLETED,
          ...(userType === UserType.CLIENT 
            ? { freelancerRating: { not: null } }
            : { clientRating: { not: null } }
          ),
        },
        _avg: userType === UserType.CLIENT 
          ? { freelancerRating: true }
          : { clientRating: true },
      }),
    ]);

    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      cancelledProjects,
      completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
      averageRating: userType === UserType.CLIENT 
        ? (averageRating._avg as any)?.freelancerRating || 0
        : (averageRating._avg as any)?.clientRating || 0,
    };

    // Cache for 5 minutes
    await this.redis.setJson(cacheKey, stats, 300);
    
    return stats;
  }
}