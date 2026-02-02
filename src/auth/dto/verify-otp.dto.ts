//src/auth/dto/verify-otp.dto.ts

import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '+94771234567' })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '1111' })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  otp: string;
}
