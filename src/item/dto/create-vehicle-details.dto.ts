//RentAnything-Backend/src/item/dto/create-vehicle-details.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDetailsDto {
  @ApiProperty({ example: 'SUV' })
  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @ApiProperty({ example: 'ABC-1234' })
  @IsString()
  @IsNotEmpty()
  vehicleNumber: string;

  @ApiProperty({ example: 4 })
  @IsNumber()
  @IsNotEmpty()
  seatingCapacity: number;

  @ApiProperty({ example: 'Petrol', enum: ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Other'] })
  @IsString()
  @IsNotEmpty()
  fuelType: string;

  @ApiProperty({ example: 'Blue', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 'https://example.com/registration.pdf', required: false })
  @IsString()
  @IsOptional()
  registrationDocument?: string;

  @ApiProperty({ example: 'https://example.com/insurance.pdf', required: false })
  @IsString()
  @IsOptional()
  insuranceDocument?: string;

  @ApiProperty({ example: 'https://example.com/revenue-license.pdf', required: false })
  @IsString()
  @IsOptional()
  revenueLicense?: string;

  @ApiProperty({ example: 500, required: false })
  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  driverAvailable?: boolean;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  driverName?: string;

  @ApiProperty({ example: 'Male', enum: ['Male', 'Female', 'Other'], required: false })
  @IsString()
  @IsOptional()
  driverGender?: string;

  @ApiProperty({ example: 'https://example.com/driver-license.pdf', required: false })
  @IsString()
  @IsOptional()
  driverLicense?: string;

  @ApiProperty({ example: 1000, required: false })
  @IsNumber()
  @IsOptional()
  driverFee?: number;
}
