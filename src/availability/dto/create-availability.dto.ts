//RentAnything-Backend/src/availability/dto/create-availability.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvailabilityDto {
  @ApiProperty({ example: '2022-01-15' })
  @IsString()
  @IsNotEmpty()
  availableDate: string;

  @ApiProperty({ example: '10:30:00' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ example: '17:30:00' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
