//RentAnything-Backend/src/auth/dto/verify-otp.dto.ts

import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+94771234567' })
  @IsPhoneNumber('LK')
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '111111' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
