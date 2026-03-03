//RentAnything-Backend/src/item/dto/create-home-details.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHomeDetailsDto {
  @ApiProperty({ example: 'Apartment' })
  @IsString()
  @IsNotEmpty()
  propertyType: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @IsNotEmpty()
  numberOfRooms: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  numberOfBathrooms: number;

  @ApiProperty({ example: '1200 sq ft' })
  @IsString()
  @IsNotEmpty()
  area: string;

  @ApiProperty({ example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isFurnished?: boolean;

  @ApiProperty({ example: ['WiFi', 'Air Conditioning', 'Parking', 'Swimming Pool'], required: false })
  @IsArray()
  @IsOptional()
  amenities?: string[];
}
