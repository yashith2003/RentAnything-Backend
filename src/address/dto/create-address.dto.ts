import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'No 45, Galle Road, Colombo' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 6.9271, required: false })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiProperty({ example: 79.8612, required: false })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiProperty({ example: '123456789', required: false })
  @IsOptional()
  @IsString()
  placeId?: string;
}
