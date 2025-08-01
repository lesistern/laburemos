import { IsString, IsOptional, IsInt, IsArray, IsEnum, IsDecimal, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Availability } from '@prisma/client';

export class UpdateFreelancerProfileDto {
  @ApiProperty({ 
    description: 'Professional title', 
    maxLength: 100,
    required: false,
    example: 'Desarrollador Full-Stack'
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiProperty({ 
    description: 'Professional overview/summary', 
    maxLength: 2000,
    required: false,
    example: 'Desarrollador con amplia experiencia en React, Node.js y bases de datos...'
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  professionalOverview?: string;

  @ApiProperty({ 
    description: 'List of skills',
    type: [String],
    required: false,
    example: ['JavaScript', 'React', 'Node.js', 'PostgreSQL']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ 
    description: 'Years of experience', 
    minimum: 0,
    maximum: 50,
    required: false,
    example: 5
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @ApiProperty({ 
    description: 'Education details',
    type: 'object',
    required: false,
    example: {
      degree: 'Ingeniería en Sistemas',
      institution: 'Universidad de Buenos Aires',
      year: 2018
    }
  })
  @IsOptional()
  education?: any;

  @ApiProperty({ 
    description: 'Certifications',
    type: 'object',
    required: false,
    example: {
      certifications: ['AWS Certified Developer', 'Google Cloud Professional']
    }
  })
  @IsOptional()
  certifications?: any;

  @ApiProperty({ 
    description: 'Portfolio items',
    type: 'object',
    required: false,
    example: {
      projects: [
        {
          title: 'E-commerce Platform',
          description: 'Plataforma de comercio electrónico completa',
          url: 'https://example.com',
          image: 'https://example.com/screenshot.jpg'
        }
      ]
    }
  })
  @IsOptional()
  portfolioItems?: any;

  @ApiProperty({ 
    description: 'Availability status',
    enum: Availability,
    required: false,
    example: Availability.FULL_TIME
  })
  @IsOptional()
  @IsEnum(Availability)
  availability?: Availability;

  @ApiProperty({ 
    description: 'Response time description', 
    maxLength: 50,
    required: false,
    example: 'Dentro de 2 horas'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  responseTime?: string;
}