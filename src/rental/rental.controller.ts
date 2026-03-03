//rentAnything-Backend/src/rental/rental.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RentalService } from './rental.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Rental } from './entities/rental.entity';

@ApiTags('rentals')
@ApiBearerAuth()
@Controller('rentals')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all rentals' })
  async findAll(): Promise<Rental[]> {
    return await this.rentalService.findAll();
  }
}
