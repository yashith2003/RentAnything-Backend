//src/item/dto/create-item.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ItemStatus } from '../entities/item.entity';

export class CreateItemDto {
  @ApiProperty({ example: 'Mountain Bike for Rent' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Standard mountain bike in excellent condition.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  addressId: number;

  @ApiProperty({ example: 'Excellent', required: false })
  @IsString()
  @IsOptional()
  condition?: string;

  @ApiProperty({ enum: ItemStatus, default: ItemStatus.AVAILABLE, required: false })
  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  deliveryAvailable?: boolean;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  pickupAvailable?: boolean;
}
