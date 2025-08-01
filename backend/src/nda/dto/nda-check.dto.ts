import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NdaCheckDto {
  @ApiProperty({
    description: 'Dirección IP del usuario a verificar',
    example: '192.168.1.1'
  })
  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @ApiProperty({
    description: 'Device fingerprint único del dispositivo a verificar',
    example: 'fp_abc123def456'
  })
  @IsString()
  @IsNotEmpty()
  deviceFingerprint: string;
}