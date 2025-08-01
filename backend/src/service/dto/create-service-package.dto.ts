import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsDecimal,
  IsArray,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PackageType } from '@prisma/client';

export class CreateServicePackageDto {
  @ApiProperty({
    description: 'Package type',
    enum: PackageType,
    example: PackageType.BASIC,
  })
  @IsEnum(PackageType)
  packageType: PackageType;

  @ApiProperty({
    description: 'Package title',
    example: 'Basic Website',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @Transform(({ value }) => value.trim())
  title: string;

  @ApiPropertyOptional({
    description: 'Package description',
    example: 'Simple 3-page website with basic functionality',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiProperty({
    description: 'Package price in ARS',
    example: 25000.00,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '0,2' })
  price: number;

  @ApiProperty({
    description: 'Delivery time in days',
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  deliveryTime: number;

  @ApiPropertyOptional({
    description: 'Number of revisions included',
    example: 2,
    minimum: 0,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  revisions?: number = 1;

  @ApiPropertyOptional({
    description: 'Package features list',
    example: ['Responsive design', 'Contact form', 'SEO optimization'],
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => 
    Array.isArray(value) ? value.map(feature => feature.trim()) : []
  )
  features?: string[];

  @ApiPropertyOptional({
    description: 'Whether this package is popular',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean = false;
}