//RentAnything-Backend/src/category/category.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { FilterConfig } from './entities/filter-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, FilterConfig])],
  providers: [CategoryService],
  controllers: [CategoryController],
  exports: [CategoryService, TypeOrmModule],
})
export class CategoryModule {}
