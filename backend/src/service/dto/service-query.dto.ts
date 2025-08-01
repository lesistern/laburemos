import {
  IsOptional,
  IsInt,
  IsBoolean,
  IsString,
  IsIn,
  IsEnum,
  IsDecimal,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PriceType } from '@prisma/client';

export class ServiceQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 12,
    minimum: 1,
    maximum: 50,
    default: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Filter by freelancer ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  freelancerId?: number;

  @ApiPropertyOptional({
    description: 'Filter by price type',
    enum: PriceType,
    example: PriceType.FIXED,
  })
  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 10000,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '0,2' })
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 100000,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '0,2' })
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum delivery time in days',
    example: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxDeliveryTime?: number;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by featured status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Search in title, description, and tags',
    example: 'website development',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'react,nodejs,responsive',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.split(',').map(tag => tag.trim().toLowerCase()))
  tags?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'ratingAverage',
    enum: ['title', 'basePrice', 'deliveryTime', 'ratingAverage', 'orderCount', 'createdAt'],
    default: 'ratingAverage',
  })
  @IsOptional()
  @IsString()
  @IsIn(['title', 'basePrice', 'deliveryTime', 'ratingAverage', 'orderCount', 'createdAt'])
  sortBy?: string = 'ratingAverage';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}