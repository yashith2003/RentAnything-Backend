//src/availability/availability.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './entities/availability.entity';

import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
  ) {}

  async create(dto: CreateAvailabilityDto) {
    const startDate = new Date(dto.fromDate);
    const endDate = new Date(dto.toDate);
    const availabilities: Availability[] = [];

    // Create a entry for each day in the range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const availability = this.availabilityRepository.create({
        availableDate: d.toISOString().split('T')[0],
        item: { id: dto.itemId } as any,
        isAvailable: true,
      });
      availabilities.push(availability);
    }
    
    return this.availabilityRepository.save(availabilities);
  }
}
