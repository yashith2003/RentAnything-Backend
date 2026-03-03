//RentAnything-Backend/src/item/dto/create-electronics-details.dto.ts

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateElectronicsDetailsDto {
  @ApiProperty({ example: 'Apple' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 'iPhone 14 Pro' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: '1 year manufacturer warranty', required: false })
  @IsString()
  @IsOptional()
  warranty?: string;

  @ApiProperty({ example: '6.1-inch display, A16 Bionic chip, 128GB storage', required: false })
  @IsString()
  @IsOptional()
  specifications?: string;
}
