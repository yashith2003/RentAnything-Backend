import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'No 45, Galle Road, Colombo' })
  @IsString()
  @IsNotEmpty()
  address: string;
}
