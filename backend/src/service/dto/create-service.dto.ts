import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsDecimal,
  IsArray,
  IsUrl,
  MinLength,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceType } from '@prisma/client';
import { CreateServicePackageDto } from './create-service-package.dto';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Service title',
    example: 'Professional Website Development',
    minLength: 10,
    maxLength: 100,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(100)
  @Transform(({ value }) => value.trim())
  title: string;

  @ApiProperty({
    description: 'Service description',
    example: 'I will create a modern, responsive website using React and Node.js...',
    minLength: 50,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(50)
  @MaxLength(2000)
  @Transform(({ value }) => value.trim())
  description: string;

  @ApiProperty({
    description: 'Category ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  categoryId: number;

  @ApiProperty({
    description: 'Price type',
    enum: PriceType,
    example: PriceType.FIXED,
  })
  @IsEnum(PriceType)
  priceType: PriceType;

  @ApiProperty({
    description: 'Base price in ARS',
    example: 50000.00,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '0,2' })
  basePrice: number;

  @ApiProperty({
    description: 'Delivery time in days',
    example: 7,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  deliveryTime: number;

  @ApiPropertyOptional({
    description: 'Number of revisions included',
    example: 3,
    minimum: 0,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  revisionsIncluded?: number = 1;

  @ApiPropertyOptional({
    description: 'Service tags for search',
    example: ['react', 'nodejs', 'responsive', 'modern'],
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => 
    Array.isArray(value) ? value.map(tag => tag.trim().toLowerCase()) : []
  )
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Special requirements or instructions',
    example: 'Please provide your brand colors and logo in vector format',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  requirements?: string;

  @ApiPropertyOptional({
    description: 'Gallery images URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  galleryImages?: string[];

  @ApiPropertyOptional({
    description: 'Service video URL',
    example: 'https://youtube.com/watch?v=example',
  })
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Service packages (Basic, Standard, Premium)',
    type: [CreateServicePackageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServicePackageDto)
  packages?: CreateServicePackageDto[];

  @ApiPropertyOptional({
    description: 'Whether the service is featured',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether the service is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}