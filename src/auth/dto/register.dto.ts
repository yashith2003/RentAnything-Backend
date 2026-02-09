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
  @IsPhoneNumber('LK')
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123 Main St, Colombo' })
  @IsString()
  @IsNotEmpty()
  address: string;
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
  @IsPhoneNumber('LK')
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '456 Business Ave, Colombo' })
  @IsString()
  @IsNotEmpty()
  officeAddress: string;
}
