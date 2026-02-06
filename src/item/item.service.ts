//src/item/item.service.ts

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { User } from '../user/entities/user.entity';
import { Category } from '../category/entities/category.entity';
import { Address } from '../address/entities/address.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateItemDto, ownerId: number) {
    const item = this.itemRepository.create({
      ...dto,
      owner: { id: ownerId } as any,
      category: { id: dto.categoryId } as any,
      address: { id: dto.addressId } as any,
    });
    return this.itemRepository.save(item);
  }

  async findAll(categoryId?: number) {
    const cacheKey = categoryId ? `items_category_${categoryId}` : 'all_items';
    const cachedItems = await this.cacheManager.get(cacheKey);
    if (cachedItems) {
      return cachedItems;
    }

    const where: any = {};
    if (categoryId) {
      where.category = { id: categoryId };
    }
    const items = await this.itemRepository.find({
      where,
      relations: ['owner', 'category', 'address'],
    });

    await this.cacheManager.set(cacheKey, items, 300); // 5 minutes cache
    return items;
  }

  async findOne(id: number) {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: ['owner', 'category', 'address', 'pricings', 'availabilities'],
    });
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  async update(id: number, dto: UpdateItemDto) {
    const item = await this.findOne(id);
    
    if (dto.categoryId) {
      (item as any).category = { id: dto.categoryId };
    }
    if (dto.addressId) {
      (item as any).address = { id: dto.addressId };
    }

    Object.assign(item, dto);
    const updatedUser = await this.itemRepository.save(item);
    
    // Invalidate cache
    await this.cacheManager.del('all_items');
    if(item.category && item.category.id) {
       await this.cacheManager.del(`items_category_${item.category.id}`);
    }

    return updatedUser;
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    const result = await this.itemRepository.remove(item);
    
     // Invalidate cache
    await this.cacheManager.del('all_items');
     if(item.category && item.category.id) {
       await this.cacheManager.del(`items_category_${item.category.id}`);
    }

    return result;
  }
}
