//src/pricing/pricing.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemPricing } from './entities/item-pricing.entity';

import { CreatePricingDto } from './dto/create-pricing.dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(ItemPricing)
    private pricingRepository: Repository<ItemPricing>,
  ) {}

  async create(dto: CreatePricingDto) {
    const pricing = this.pricingRepository.create({
      rateType: dto.rateType as any,
      price: dto.price,
      item: { id: dto.itemId } as any,
    });
    return this.pricingRepository.save(pricing);
  }
}
