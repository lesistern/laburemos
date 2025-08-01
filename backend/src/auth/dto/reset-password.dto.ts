import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yzA',
    description: 'Password reset token',
  })
  @IsString()
  @MinLength(1, { message: 'Reset token is required' })
  token: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'New password (minimum 8 characters, must contain uppercase, lowercase, number, and special character)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message: 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;
}