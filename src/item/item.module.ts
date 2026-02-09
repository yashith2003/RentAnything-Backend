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

import { User } from '../user/entities/user.entity';
import { Category } from '../category/entities/category.entity';
import { Address } from '../address/entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Item,
      User,
      Category,
      Address,
      VehicleDetails,
      ElectronicsDetails,
      FashionDetails,
      SportsDetails,
      HomeDetails,
    ]),
  ],
  providers: [ItemService],
  controllers: [ItemController],
  exports: [ItemService, TypeOrmModule],
})
export class ItemModule {}

