//src/availability/availability.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './entities/availability.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getByItemId(itemId: number): Promise<Availability[]> {
    const cacheKey = `availability_item_${itemId}`;
    const cached = await this.cacheManager.get<Availability[]>(cacheKey);
    if (cached) return cached;

    const records = await this.availabilityRepository.find({
      where: { item: { id: itemId } },
      order: { availableDate: 'ASC' },
    });

    await this.cacheManager.set(cacheKey, records, 300000); // 5 min TTL
    return records;
  }

  async invalidateCache(itemId: number): Promise<void> {
    await this.cacheManager.del(`availability_item_${itemId}`);
  }
}
