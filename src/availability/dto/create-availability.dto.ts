import { IsNumber, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvailabilityDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  itemId: number;

  @ApiProperty({ example: '2026-02-10' })
  @IsDateString()
  @IsNotEmpty()
  fromDate: string;

  @ApiProperty({ example: '2026-02-20' })
  @IsDateString()
  @IsNotEmpty()
  toDate: string;
}
