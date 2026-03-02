//RentAnything-Backend/src/user/dto/update-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsBoolean, IsEnum } from 'class-validator';
import { z } from 'zod';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+919876543210', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'uploads/avatar.jpg', required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ example: 'My Company LLC', required: false })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty({ example: 'uploads/logo.jpg', required: false })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'A reliable user/company', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'New York', required: false })
  @IsString()
  @IsOptional()
  location?: string;
}

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  fullName: z.string().optional(),
  avatarUrl: z.string().optional(),
  companyName: z.string().optional(),
  logoUrl: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
}).strict();

export type UpdateUserType = z.infer<typeof UpdateUserSchema>;
