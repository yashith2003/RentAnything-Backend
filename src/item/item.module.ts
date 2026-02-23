//src/item/item.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { VehicleDetails } from './entities/vehicle-details.entity';
import { ElectronicsDetails } from './entities/electronics-details.entity';
import { FashionDetails } from './entities/fashion-details.entity';
import { SportsDetails } from './entities/sports-details.entity';
import { HomeDetails } from './entities/home-details.entity';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { CategoryDetailsService } from './services/category-details.service';
import { SavedItem } from './entities/saved-item.entity';
import { SavedItemService } from './saved-item.service';
import { SavedItemController } from './saved-item.controller';

import { User } from '../user/entities/user.entity';
import { Category } from '../category/entities/category.entity';
import { Address } from '../address/entities/address.entity';
import { ItemPricing } from '../pricing/entities/item-pricing.entity';
import { Availability } from '../availability/entities/availability.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Item,
      User,
      Category,
      Address,
      ItemPricing,
      VehicleDetails,
      ElectronicsDetails,
      FashionDetails,
      SportsDetails,
      HomeDetails,
      Availability,
      SavedItem,
    ]),
  ],
  providers: [ItemService, CategoryDetailsService, SavedItemService],
  controllers: [SavedItemController, ItemController],
  exports: [ItemService, CategoryDetailsService, SavedItemService, TypeOrmModule],
})
export class ItemModule {}


