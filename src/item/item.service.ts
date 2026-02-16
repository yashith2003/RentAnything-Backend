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
import { ItemPricing } from '../pricing/entities/item-pricing.entity';
import { Availability } from '../availability/entities/availability.entity';
import { CategoryDetailsService } from './services/category-details.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @InjectRepository(ItemPricing) private pricingRepository: Repository<ItemPricing>,
    @InjectRepository(Availability) private availabilityRepository: Repository<Availability>,
    private categoryDetailsService: CategoryDetailsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateItemDto, ownerId: number) {
    try {
      console.log(`[ItemService] Creating item: ${dto.title} for owner: ${ownerId}`);
      
      const item = this.itemRepository.create({
        ...dto,
        owner: { id: ownerId } as any,
        category: { id: dto.categoryId } as any,
        address: { id: dto.addressId } as any,
      });
      const savedItem = await this.itemRepository.save(item);

      // Save pricing if provided
      if (dto.rateType && dto.price) {
        const pricing = this.pricingRepository.create({
          rateType: dto.rateType as any,
          price: dto.price,
          item: savedItem,
        });
        await this.pricingRepository.save(pricing);
      }

      // Save availabilities if provided
      if (dto.availabilities && dto.availabilities.length > 0) {
        const availabilities = dto.availabilities.map((adv) =>
          this.availabilityRepository.create({
            ...adv,
            item: savedItem,
          }),
        );
        await this.availabilityRepository.save(availabilities);
      }

      // Save category-specific details
      const category = await this.categoryRepository.findOne({ 
        where: { id: dto.categoryId },
        relations: ['parentCategory']
      });

      if (category) {
        const categoryName = category.parentCategory?.name || category.name;
        console.log(`[ItemService] Saving details for category: ${categoryName}`);
        
        if (dto.vehicleDetails) {
          await this.categoryDetailsService.saveVehicleDetails(savedItem, dto.vehicleDetails);
        } else if (dto.electronicsDetails) {
          await this.categoryDetailsService.saveElectronicsDetails(savedItem, dto.electronicsDetails);
        } else if (dto.homeDetails) {
          await this.categoryDetailsService.saveHomeDetails(savedItem, dto.homeDetails);
        } else if (dto.fashionDetails) {
          await this.categoryDetailsService.saveFashionDetails(savedItem, dto.fashionDetails);
        } else if (dto.sportsDetails) {
          await this.categoryDetailsService.saveSportsDetails(savedItem, dto.sportsDetails);
        }
      } else {
        console.warn(`[ItemService] Category with ID ${dto.categoryId} not found. Skipping category details.`);
      }

      return savedItem;
    } catch (error) {
      console.error('[ItemService] Failed to create item:', error);
      throw error;
    }
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
    await this.cacheManager.set(cacheKey, items, 300); // 5 minutes cache
    return items;
  }

  async findMyItems(ownerId: number) {
    return this.itemRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['category', 'address', 'owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const item = await this.itemRepository.findOne({
      where: { id },
      relations: [
        'owner', 
        'owner.individualUser', 
        'owner.company', 
        'category', 
        'category.parentCategory', 
        'address', 
        'pricings', 
        'availabilities'
      ],
    });
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    // Fetch and attach category-specific details
    const categoryName = item.category.parentCategory?.name || item.category.name;
    const categoryDetails = await this.categoryDetailsService.getCategoryDetails(id, categoryName);
    
    return {
      ...item,
      categoryDetails,
    };
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
    
    // Delete category-specific details first
    const categoryName = (item as any).category.parentCategory?.name || (item as any).category.name;
    await this.categoryDetailsService.deleteCategoryDetails(id, categoryName);
    
    const result = await this.itemRepository.remove(item as any);
    
     // Invalidate cache
    await this.cacheManager.del('all_items');
     if((item as any).category && (item as any).category.id) {
       await this.cacheManager.del(`items_category_${(item as any).category.id}`);
    }

    return result;
  }
}
