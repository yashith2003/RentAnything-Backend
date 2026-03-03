//RentAnything-Backend/src/incident/dto/create-incident.dto.ts

import { IsNotEmpty, IsNumber, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class IncidentMediaDto {
  @IsString()
  @IsNotEmpty()
  mediaType: string;

  @IsString()
  @IsNotEmpty()
  mediaUrl: string;
}

export class CreateIncidentDto {
  @IsNumber()
  @IsNotEmpty()
  rentalId: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => IncidentMediaDto)
  media?: IncidentMediaDto[];
}
