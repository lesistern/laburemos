import { IsEmail, IsString, IsOptional, IsEnum, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'User password (minimum 8 characters, must contain uppercase, lowercase, number, and special character)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @ApiPropertyOptional({
    example: 'CLIENT',
    description: 'User type',
    enum: UserType,
    default: UserType.CLIENT,
  })
  @IsOptional()
  @IsEnum(UserType, { message: 'User type must be CLIENT, FREELANCER, or ADMIN' })
  userType?: UserType;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'User phone number',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Please provide a valid phone number' })
  phone?: string;

  @ApiPropertyOptional({
    example: 'Argentina',
    description: 'User country',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Country name must not exceed 100 characters' })
  country?: string;

  @ApiPropertyOptional({
    example: 'Buenos Aires',
    description: 'User city',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'City name must not exceed 100 characters' })
  city?: string;

  @ApiPropertyOptional({
    example: 'Buenos Aires',
    description: 'User state or province',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'State/Province name must not exceed 100 characters' })
  stateProvince?: string;

  @ApiPropertyOptional({
    example: '1000',
    description: 'User postal code',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Postal code must not exceed 20 characters' })
  postalCode?: string;

  @ApiPropertyOptional({
    example: '123 Main Street, Apt 4B',
    description: 'User address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Address must not exceed 500 characters' })
  address?: string;

  @ApiPropertyOptional({
    example: '12345678',
    description: 'DNI or CUIT number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'DNI/CUIT must not exceed 20 characters' })
  dniCuit?: string;
}