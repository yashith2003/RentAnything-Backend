//RentAnything-Backend/src/item/dto/create-sports-details.dto.ts

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSportsDetailsDto {
  @ApiProperty({ example: 'Cricket' })
  @IsString()
  @IsNotEmpty()
  sportType: string;

  @ApiProperty({ example: 'Bat', required: false })
  @IsString()
  @IsOptional()
  equipmentType?: string;

  @ApiProperty({ example: 'Professional', enum: ['Beginner', 'Intermediate', 'Professional', 'All Levels'], required: false })
  @IsString()
  @IsOptional()
  suitableFor?: string;
}
