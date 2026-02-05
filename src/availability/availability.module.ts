//src/availability/availability.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from './entities/availability.entity';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Availability])],
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
  exports: [AvailabilityService, TypeOrmModule],
})
export class AvailabilityModule {}
