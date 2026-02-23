//RentAnything-Backend/src/user/dto/create-user.dto.ts

import { IsString, IsEmail, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.INDIVIDUAL })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: 'active', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
