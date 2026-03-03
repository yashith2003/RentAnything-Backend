//RentAnything-Backend/src/availability/availability.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Availability } from './entities/availability.entity';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Availability]),
    CacheModule.register(),
  ],
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
  exports: [AvailabilityService, TypeOrmModule],
})
export class AvailabilityModule {}
