//src/item/dto/create-item.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ItemStatus } from '../entities/item.entity';
import { CreateAvailabilityDto } from '../../availability/dto/create-availability.dto';
import { CreateVehicleDetailsDto } from './create-vehicle-details.dto';
import { CreateElectronicsDetailsDto } from './create-electronics-details.dto';
import { CreateHomeDetailsDto } from './create-home-details.dto';
import { CreateFashionDetailsDto } from './create-fashion-details.dto';
import { CreateSportsDetailsDto } from './create-sports-details.dto';

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

  @ApiProperty({ example: '+94771234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'No smoking, no pets.', required: false })
  @IsString()
  @IsOptional()
  rentalTerms?: string;

  @ApiProperty({ example: 'Handle with care.', required: false })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({ example: 1000.0, required: false })
  @IsNumber()
  @IsOptional()
  securityDeposit?: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 'daily', enum: ['hourly', 'daily', 'weekly', 'monthly'], required: false })
  @IsOptional()
  rateType?: string;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ type: () => [CreateAvailabilityDto], required: false })
  @IsOptional()
  availabilities?: CreateAvailabilityDto[];

  // Category-specific details
  @ApiProperty({ type: () => CreateVehicleDetailsDto, required: false })
  @ValidateNested()
  @Type(() => CreateVehicleDetailsDto)
  @IsOptional()
  vehicleDetails?: CreateVehicleDetailsDto;

  @ApiProperty({ type: () => CreateElectronicsDetailsDto, required: false })
  @ValidateNested()
  @Type(() => CreateElectronicsDetailsDto)
  @IsOptional()
  electronicsDetails?: CreateElectronicsDetailsDto;

  @ApiProperty({ type: () => CreateHomeDetailsDto, required: false })
  @ValidateNested()
  @Type(() => CreateHomeDetailsDto)
  @IsOptional()
  homeDetails?: CreateHomeDetailsDto;

  @ApiProperty({ type: () => CreateFashionDetailsDto, required: false })
  @ValidateNested()
  @Type(() => CreateFashionDetailsDto)
  @IsOptional()
  fashionDetails?: CreateFashionDetailsDto;

  @ApiProperty({ type: () => CreateSportsDetailsDto, required: false })
  @ValidateNested()
  @Type(() => CreateSportsDetailsDto)
  @IsOptional()
  sportsDetails?: CreateSportsDetailsDto;
}

