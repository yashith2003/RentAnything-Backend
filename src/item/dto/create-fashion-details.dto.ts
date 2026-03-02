//src/item/dto/create-fashion-details.dto.ts

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFashionDetailsDto {
  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({ example: 'Unisex', enum: ['Male', 'Female', 'Unisex', 'Kids'] })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: 'Nike', required: false })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: 'Cotton', required: false })
  @IsString()
  @IsOptional()
  material?: string;
}
