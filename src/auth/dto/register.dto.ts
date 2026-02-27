//src/auth/dto/register.dto.ts

import { IsEmail, IsNotEmpty, IsOptional, IsString, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterIndividualDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+94771234567' })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123 Main St, Colombo' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 6.9271, required: false })
  @IsOptional()
  lat?: number;

  @ApiProperty({ example: 79.8612, required: false })
  @IsOptional()
  lng?: number;

  @ApiProperty({ example: 'place_id_123', required: false })
  @IsString()
  @IsOptional()
  placeId?: string;
}

export class RegisterCompanyDto {
  @ApiProperty({ example: 'Tech Corp' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'REG123456' })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiProperty({ example: 'info@techcorp.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+94112345678' })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '456 Business Ave, Colombo' })
  @IsString()
  @IsNotEmpty()
  officeAddress: string;

  @ApiProperty({ example: 6.9271, required: false })
  @IsOptional()
  lat?: number;

  @ApiProperty({ example: 79.8612, required: false })
  @IsOptional()
  lng?: number;

  @ApiProperty({ example: 'place_id_456', required: false })
  @IsString()
  @IsOptional()
  placeId?: string;
}
