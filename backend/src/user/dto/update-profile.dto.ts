import { IsString, IsOptional, IsEmail, IsPhoneNumber, IsDecimal, IsEnum, IsUrl, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @ApiProperty({ 
    description: 'First name', 
    maxLength: 50,
    required: false,
    example: 'Juan'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({ 
    description: 'Last name', 
    maxLength: 50,
    required: false,
    example: 'Pérez'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({ 
    description: 'Phone number', 
    required: false,
    example: '+5491112345678'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ 
    description: 'Country', 
    maxLength: 100,
    required: false,
    example: 'Argentina'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({ 
    description: 'City', 
    maxLength: 100,
    required: false,
    example: 'Buenos Aires'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ 
    description: 'State or Province', 
    maxLength: 100,
    required: false,
    example: 'Ciudad Autónoma de Buenos Aires'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  stateProvince?: string;

  @ApiProperty({ 
    description: 'Postal code', 
    maxLength: 20,
    required: false,
    example: '1000'
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({ 
    description: 'Address', 
    maxLength: 200,
    required: false,
    example: 'Av. Corrientes 1234'
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiProperty({ 
    description: 'DNI or CUIT', 
    maxLength: 20,
    required: false,
    example: '12345678'
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  dniCuit?: string;

  @ApiProperty({ 
    description: 'Profile image URL', 
    required: false,
    example: 'https://example.com/profile.jpg'
  })
  @IsOptional()
  @IsUrl()
  profileImage?: string;

  @ApiProperty({ 
    description: 'User biography', 
    maxLength: 1000,
    required: false,
    example: 'Desarrollador full-stack con 5 años de experiencia...'
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiProperty({ 
    description: 'Hourly rate', 
    required: false,
    example: 2500.00,
    type: 'number',
    format: 'decimal'
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsDecimal({ decimal_digits: '0,2' })
  hourlyRate?: number;

  @ApiProperty({ 
    description: 'Currency code', 
    maxLength: 3,
    required: false,
    example: 'ARS'
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ 
    description: 'Language preference', 
    maxLength: 10,
    required: false,
    example: 'es'
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiProperty({ 
    description: 'Timezone', 
    maxLength: 50,
    required: false,
    example: 'America/Argentina/Buenos_Aires'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}