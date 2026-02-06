//src/rental/rental.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { RentalService } from './rental.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Rental } from './entities/rental.entity';

@Controller('rentals')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<Rental[]> {
    return await this.rentalService.findAll();
  }
}
