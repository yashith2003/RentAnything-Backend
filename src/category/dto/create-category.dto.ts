//RentAnything-Backend/src/category/dto/create-category.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Vehicles' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  parentId?: number;
}
