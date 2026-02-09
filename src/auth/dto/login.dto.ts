//src/auth/dto/login.dto.ts

import { IsNotEmpty, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '+94771234567' })
  @IsPhoneNumber('LK')
  @IsNotEmpty()
  phone: string;
}
