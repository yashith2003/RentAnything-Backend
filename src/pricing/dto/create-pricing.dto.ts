import { IsNumber, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePricingDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  itemId: number;

  @ApiProperty({ example: 'daily', enum: ['daily', 'weekly', 'monthly'] })
  @IsEnum(['daily', 'weekly', 'monthly'])
  @IsNotEmpty()
  rateType: string;

  @ApiProperty({ example: 120 })
  @IsNumber()
  @IsNotEmpty()
  price: number;
}
