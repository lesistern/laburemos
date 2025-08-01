import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { Category, Prisma } from '@prisma/client';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name, parentId, ...data } = createCategoryDto;

    // Check if parent exists (if provided)
    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent category with ID ${parentId} not found`);
      }
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });
    if (existingCategory) {
      throw new BadRequestException(`Category with slug "${slug}" already exists`);
    }

    return this.prisma.category.create({
      data: {
        name,
        slug,
        parentId,
        ...data,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            services: true,
            children: true,
          },
        },
      },
    });
  }

  async findAll(query: CategoryQueryDto) {
    const {
      page = 1,
      limit = 10,
      parentId,
      isActive,
      search,
      sortBy = 'displayOrder',
      sortOrder = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {
      ...(parentId !== undefined && { parentId }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          parent: true,
          children: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
          _count: {
            select: {
              services: true,
              children: true,
            },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        services: {
          where: { isActive: true },
          take: 10, // Limit services to avoid large payloads
          orderBy: { createdAt: 'desc' },
          include: {
            freelancer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
        _count: {
          select: {
            services: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
        services: {
          where: { isActive: true },
          take: 20,
          orderBy: { ratingAverage: 'desc' },
          include: {
            freelancer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
        _count: {
          select: {
            services: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const { name, parentId, ...data } = updateCategoryDto;

    // If updating parent, check if it creates a circular reference
    if (parentId && parentId !== category.parentId) {
      await this.checkCircularReference(id, parentId);
    }

    // Update slug if name is changed
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Check if new slug already exists
      const existingCategory = await this.prisma.category.findUnique({
        where: { slug },
      });
      if (existingCategory && existingCategory.id !== id) {
        throw new BadRequestException(`Category with slug "${slug}" already exists`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(name && { name, slug }),
        ...(parentId !== undefined && { parentId }),
        ...data,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            services: true,
            children: true,
          },
        },
      },
    });
  }

  async remove(id: number): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        services: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category has children or services
    if (category.children.length > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }

    if (category.services.length > 0) {
      throw new BadRequestException('Cannot delete category with associated services');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async getHierarchy(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          include: {
            children: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' },
              include: {
                _count: {
                  select: { services: true },
                },
              },
            },
            _count: {
              select: { services: true },
            },
          },
        },
        _count: {
          select: { services: true },
        },
      },
    });
  }

  private async checkCircularReference(categoryId: number, parentId: number): Promise<void> {
    let currentParentId = parentId;
    const visited = new Set<number>();

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new BadRequestException('Circular reference detected in category hierarchy');
      }

      if (currentParentId === categoryId) {
        throw new BadRequestException('Cannot set category as its own parent');
      }

      visited.add(currentParentId);

      const parent = await this.prisma.category.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });

      if (!parent) {
        throw new NotFoundException(`Parent category with ID ${currentParentId} not found`);
      }

      currentParentId = parent.parentId;
    }
  }
}