//RentAnything-Backend/src/pricing/pricing.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemPricing } from './entities/item-pricing.entity';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ItemPricing])],
  providers: [PricingService],
  controllers: [PricingController],
  exports: [PricingService, TypeOrmModule],
})
export class PricingModule {}
