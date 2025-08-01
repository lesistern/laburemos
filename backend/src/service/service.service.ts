import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { Service, Prisma, UserType } from '@prisma/client';
import { CreateServiceDto, UpdateServiceDto, ServiceQueryDto } from './dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(freelancerId: number, createServiceDto: CreateServiceDto): Promise<Service> {
    const { packages, tags, galleryImages, ...serviceData } = createServiceDto;

    // Verify freelancer exists and has freelancer role
    const freelancer = await this.prisma.user.findUnique({
      where: { id: freelancerId },
      include: { freelancerProfile: true },
    });

    if (!freelancer) {
      throw new NotFoundException('Freelancer not found');
    }

    if (freelancer.userType !== UserType.FREELANCER) {
      throw new ForbiddenException('Only freelancers can create services');
    }

    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: createServiceDto.categoryId },
    });

    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found or inactive');
    }

    // Create service with packages
    return this.prisma.service.create({
      data: {
        ...serviceData,
        freelancerId,
        tags: tags ? JSON.stringify(tags) : null,
        galleryImages: galleryImages ? JSON.stringify(galleryImages) : null,
        packages: packages ? {
          create: packages.map(pkg => ({
            ...pkg,
            features: pkg.features ? JSON.stringify(pkg.features) : null,
          })),
        } : undefined,
      },
      include: {
        freelancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            freelancerProfile: {
              select: {
                ratingAverage: true,
                totalReviews: true,
                responseTime: true,
              },
            },
          },
        },
        category: true,
        packages: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });
  }

  async findAll(query: ServiceQueryDto) {
    const {
      page = 1,
      limit = 12,
      categoryId,
      freelancerId,
      priceType,
      minPrice,
      maxPrice,
      maxDeliveryTime,
      isActive,
      isFeatured,
      search,
      tags,
      sortBy = 'ratingAverage',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {
      ...(categoryId && { categoryId }),
      ...(freelancerId && { freelancerId }),
      ...(priceType && { priceType }),
      ...(minPrice !== undefined && { basePrice: { gte: minPrice } }),
      ...(maxPrice !== undefined && { basePrice: { lte: maxPrice } }),
      ...(maxDeliveryTime && { deliveryTime: { lte: maxDeliveryTime } }),
      ...(isActive !== undefined && { isActive }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(tags && Array.isArray(tags) && {
        tags: {
          path: [],
          array_contains: tags,
        },
      }),
    };

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          freelancer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              freelancerProfile: {
                select: {
                  ratingAverage: true,
                  totalReviews: true,
                  responseTime: true,
                },
              },
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          packages: {
            orderBy: {
              packageType: 'asc',
            },
          },
          _count: {
            select: {
              projects: true,
            },
          },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    // Parse JSON fields
    const servicesWithParsedData = services.map(service => ({
      ...service,
      tags: service.tags ? JSON.parse(service.tags as string) : [],
      galleryImages: service.galleryImages ? JSON.parse(service.galleryImages as string) : [],
      packages: service.packages.map(pkg => ({
        ...pkg,
        features: pkg.features ? JSON.parse(pkg.features as string) : [],
      })),
    }));

    return {
      data: servicesWithParsedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Service> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        freelancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            bio: true,
            country: true,
            city: true,
            createdAt: true,
            freelancerProfile: {
              select: {
                title: true,
                professionalOverview: true,
                skills: true,
                experienceYears: true,
                ratingAverage: true,
                totalReviews: true,
                totalProjects: true,
                responseTime: true,
                completionRate: true,
                onTimeRate: true,
                lastActive: true,
              },
            },
          },
        },
        category: true,
        packages: {
          orderBy: {
            packageType: 'asc',
          },
        },
        projects: {
          where: {
            status: 'COMPLETED',
          },
          take: 5,
          orderBy: {
            completedAt: 'desc',
          },
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
            reviews: {
              where: {
                reviewedId: id,
              },
              take: 1,
              select: {
                rating: true,
                comment: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Increment view count
    await this.prisma.service.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Parse JSON fields
    return {
      ...service,
      tags: service.tags ? JSON.parse(service.tags as string) : [],
      galleryImages: service.galleryImages ? JSON.parse(service.galleryImages as string) : [],
      packages: service.packages.map(pkg => ({
        ...pkg,
        features: pkg.features ? JSON.parse(pkg.features as string) : [],
      })),
    } as any;
  }

  async update(id: number, userId: number, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { freelancer: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Check if user owns the service
    if (service.freelancerId !== userId) {
      throw new ForbiddenException('You can only update your own services');
    }

    const { packages, tags, galleryImages, ...serviceData } = updateServiceDto;

    // If category is being updated, verify it exists
    if (serviceData.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: serviceData.categoryId },
      });

      if (!category || !category.isActive) {
        throw new NotFoundException('Category not found or inactive');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Update service
      const updatedService = await tx.service.update({
        where: { id },
        data: {
          ...serviceData,
          tags: tags ? JSON.stringify(tags) : undefined,
          galleryImages: galleryImages ? JSON.stringify(galleryImages) : undefined,
        },
      });

      // Update packages if provided
      if (packages) {
        // Delete existing packages
        await tx.servicePackage.deleteMany({
          where: { serviceId: id },
        });

        // Create new packages
        await tx.servicePackage.createMany({
          data: packages.map(pkg => ({
            ...pkg,
            serviceId: id,
            features: pkg.features ? JSON.stringify(pkg.features) : null,
          })),
        });
      }

      // Return updated service with includes
      return tx.service.findUnique({
        where: { id },
        include: {
          freelancer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              freelancerProfile: {
                select: {
                  ratingAverage: true,
                  totalReviews: true,
                  responseTime: true,
                },
              },
            },
          },
          category: true,
          packages: true,
          _count: {
            select: {
              projects: true,
            },
          },
        },
      });
    });
  }

  async remove(id: number, userId: number): Promise<Service> {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Check if user owns the service
    if (service.freelancerId !== userId) {
      throw new ForbiddenException('You can only delete your own services');
    }

    // Check if service has active projects
    const activeProjects = service.projects.filter(
      project => !['COMPLETED', 'CANCELLED'].includes(project.status)
    );

    if (activeProjects.length > 0) {
      throw new BadRequestException('Cannot delete service with active projects');
    }

    return this.prisma.service.delete({
      where: { id },
    });
  }

  async findByFreelancer(freelancerId: number, query: ServiceQueryDto) {
    const { page = 1, limit = 10, ...filters } = query;
    
    return this.findAll({
      ...filters,
      page,
      limit,
      freelancerId,
    });
  }

  async findFeatured(limit: number = 8) {
    const services = await this.prisma.service.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      take: limit,
      orderBy: {
        ratingAverage: 'desc',
      },
      include: {
        freelancer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            freelancerProfile: {
              select: {
                ratingAverage: true,
                totalReviews: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    return services.map(service => ({
      ...service,
      tags: service.tags ? JSON.parse(service.tags as string) : [],
      galleryImages: service.galleryImages ? JSON.parse(service.galleryImages as string) : [],
    }));
  }
}