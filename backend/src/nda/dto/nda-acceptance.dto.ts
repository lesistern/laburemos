import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NdaAcceptanceDto {
  @ApiProperty({
    description: 'Email del usuario que acepta el NDA',
    example: 'usuario@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Dirección IP del usuario',
    example: '192.168.1.1'
  })
  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @ApiProperty({
    description: 'Device fingerprint único del dispositivo',
    example: 'fp_abc123def456'
  })
  @IsString()
  @IsNotEmpty()
  deviceFingerprint: string;

  @ApiProperty({
    description: 'User agent del navegador',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false
  })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiProperty({
    description: 'Versión del NDA aceptado',
    example: '1.0',
    required: false
  })
  @IsString()
  @IsOptional()
  ndaVersion?: string;
}