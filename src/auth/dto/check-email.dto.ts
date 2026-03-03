//RentAnything-Backend/src/auth/dto/check-email.dto.ts

import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
