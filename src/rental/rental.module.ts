//RentAnything-Backend/src/rental/rental.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { RentalRequest } from './entities/rental-request.entity';
import { RentalService } from './rental.service';
import { RentalController } from './rental.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Rental, RentalRequest])],
  controllers: [RentalController],
  providers: [RentalService],
  exports: [TypeOrmModule],
})
export class RentalModule {}
