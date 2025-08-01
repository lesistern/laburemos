import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsUrl, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Category slug (URL-friendly name)', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug: string;

  @ApiPropertyOptional({ description: 'Category description', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Category icon URL' })
  @IsOptional()
  @IsUrl()
  icon?: string;

  @ApiPropertyOptional({ description: 'Parent category ID for hierarchical categories' })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({ description: 'Display order for sorting', minimum: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Category active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Category name', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Category slug (URL-friendly name)', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ description: 'Category description', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Category icon URL' })
  @IsOptional()
  @IsUrl()
  icon?: string;

  @ApiPropertyOptional({ description: 'Parent category ID for hierarchical categories' })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiPropertyOptional({ description: 'Display order for sorting', minimum: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Category active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CategoryFiltersDto {
  @ApiPropertyOptional({ description: 'Search by name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by parent category ID (null for root categories)' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value === 'null' ? null : parseInt(value))
  parentId?: number | null;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['name', 'displayOrder', 'createdAt', 'serviceCount'] })
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

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  id: number;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Category description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Category icon URL' })
  icon?: string;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  parentId?: number;

  @ApiProperty({ description: 'Display order' })
  displayOrder: number;

  @ApiProperty({ description: 'Category active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Category creation timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Parent category information' })
  parent?: {
    id: number;
    name: string;
    slug: string;
  };

  @ApiProperty({ description: 'Child categories', type: 'array', items: { type: 'object' } })
  children: {
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
    serviceCount: number;
  }[];

  @ApiProperty({ description: 'Statistics about this category' })
  stats: {
    serviceCount: number;
    activeServiceCount: number;
    totalProjects: number;
    completedProjects: number;
    totalRevenue: number;
    averageProjectValue: number;
    averageRating: number;
  };
}

export class CategoryHierarchyDto {
  @ApiProperty({ description: 'Category ID' })
  id: number;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category slug' })
  slug: string;

  @ApiPropertyOptional({ description: 'Category icon' })
  icon?: string;

  @ApiProperty({ description: 'Display order' })
  displayOrder: number;

  @ApiProperty({ description: 'Is category active' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of services in this category' })
  serviceCount: number;

  @ApiProperty({ description: 'Child categories', type: 'array', items: { $ref: '#/components/schemas/CategoryHierarchyDto' } })
  children: CategoryHierarchyDto[];
}

export class CategoryAnalyticsDto {
  @ApiProperty({ description: 'Category performance metrics' })
  performance: {
    totalRevenue: number;
    averageProjectValue: number;
    projectCount: number;
    completionRate: number;
    averageRating: number;
    growthRate: number;
  };

  @ApiProperty({ description: 'Monthly trends', type: 'array', items: { type: 'object' } })
  monthlyTrends: {
    month: string;
    projectCount: number;
    revenue: number;
    newServices: number;
    averageRating: number;
  }[];

  @ApiProperty({ description: 'Top freelancers in this category', type: 'array', items: { type: 'object' } })
  topFreelancers: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage?: string;
    completedProjects: number;
    averageRating: number;
    totalEarnings: number;
  }[];

  @ApiProperty({ description: 'Popular search terms related to this category', type: 'array', items: { type: 'object' } })
  searchTerms: {
    term: string;
    count: number;
  }[];
}