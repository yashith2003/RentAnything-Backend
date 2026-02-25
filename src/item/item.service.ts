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
import * as cacheManager from 'cache-manager';

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
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
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

  async findAll(categoryId?: number, filters?: any): Promise<Item[]> {
    const cacheKey = categoryId ? `items_category_${categoryId}_${JSON.stringify(filters)}` : 'all_items';
    const cachedItems = await this.cacheManager.get<Item[]>(cacheKey);
    if (cachedItems) {
      return cachedItems;
    }

    const queryBuilder = this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.owner', 'owner')
      .leftJoinAndSelect('owner.individualUser', 'individualUser')
      .leftJoinAndSelect('owner.company', 'company')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('category.parentCategory', 'parentCategory')
      .leftJoinAndSelect('item.address', 'address')
      .leftJoinAndSelect('item.pricings', 'pricing')
      .leftJoin('item.reviews', 'review')
      .addSelect('COUNT(review.id)', 'item_reviewCount')
      .addSelect('AVG(review.rating)', 'item_averageRating');

    if (categoryId) {
      // Get all subcategories recursively
      const subcategories = await this.categoryRepository.query(`
        WITH RECURSIVE cat_tree AS (
          SELECT id FROM categories WHERE id = $1
          UNION ALL
          SELECT c.id FROM categories c
          INNER JOIN cat_tree ct ON c.parent_category_id = ct.id
        )
        SELECT id FROM cat_tree
      `, [categoryId]);
      const categoryIds = subcategories.map((c: any) => c.id);
      queryBuilder.andWhere('item.category_id IN (:...categoryIds)', { categoryIds });
      
      // Dynamic Filter logic
      const category = await this.categoryRepository.findOne({ 
        where: { id: categoryId },
        relations: ['parentCategory']
      });

      if (category && filters && Object.keys(filters).length > 0) {
        const categoryName = (category.parentCategory?.name || category.name).toLowerCase();
        
        let detailTable = '';
        if (categoryName.includes('vehicle')) detailTable = 'vehicle_details';
        else if (categoryName.includes('electronic')) detailTable = 'electronics_details';
        else if (categoryName.includes('home')) detailTable = 'home_details';
        else if (categoryName.includes('fashion')) detailTable = 'fashion_details';
        else if (categoryName.includes('sport')) detailTable = 'sports_details';

        if (detailTable) {
          queryBuilder.leftJoinAndSelect(`item.${detailTable.replace(/_([a-z])/g, (g) => g[1].toUpperCase())}`, 'details');
          
          // Filter out global filters (access, condition, distance) - only apply category-specific filters
          const globalFilterKeys = ['access', 'condition', 'distance'];
          Object.keys(filters).forEach((key) => {
            if (!globalFilterKeys.includes(key)) {
              const val = filters[key];
              if (val !== undefined && val !== null && val !== '') {
                 // Handle different filter types if needed (e.g. range)
                 if (key === 'seatingCapacity' || key === 'price') {
                    // Range logic would need min/max in filters
                 } else {
                    queryBuilder.andWhere(`details.${key} = :${key}`, { [key]: val });
                 }
              }
            }
          });
        }
      }
    }

    queryBuilder.groupBy('item.id')
      .addGroupBy('owner.id')
      .addGroupBy('individualUser.id')
      .addGroupBy('company.id')
      .addGroupBy('category.id')
      .addGroupBy('parentCategory.id')
      .addGroupBy('address.id')
      .addGroupBy('pricing.id');

    const items = await queryBuilder.getRawAndEntities();

    const result = items.entities.map((entity, index) => {
      const raw = items.raw[index];
      return {
        ...entity,
        reviewCount: parseInt(raw.item_reviewCount, 10) || 0,
        averageRating: parseFloat(raw.item_averageRating) || 0,
      };
    });

    await this.cacheManager.set(cacheKey, result, 300); // 5 minutes cache
    return result as any;
  }

  async findMyItems(ownerId: number) {
    return this.itemRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['category', 'address', 'owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyItemsWithReviewStats(ownerId: number) {
    const queryBuilder = this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.address', 'address')
      .leftJoinAndSelect('item.pricings', 'pricing')
      .leftJoin('item.reviews', 'review')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .addSelect('AVG(review.rating)', 'averageRating')
      .where('item.owner_id = :ownerId', { ownerId })
      .groupBy('item.id')
      .addGroupBy('category.id')
      .addGroupBy('address.id')
      .addGroupBy('pricing.id')
      .orderBy('item.createdAt', 'DESC');

    const rawAndEntities = await queryBuilder.getRawAndEntities();

    return rawAndEntities.entities.map((item, index) => {
      const raw = rawAndEntities.raw[index];
      return {
        ...item,
        reviewCount: parseInt(raw.reviewCount, 10) || 0,
        averageRating: parseFloat(raw.averageRating) || 0,
      };
    });
  }

  async findByOwner(ownerId: number) {
    return this.itemRepository.find({
      where: { owner: { id: ownerId } },
      relations: ['category', 'address', 'pricings'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const cacheKey = `item:${id}`;
    const cachedItem = await this.cacheManager.get<any>(cacheKey);
    if (cachedItem) return cachedItem;

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
        'availabilities',
        'reviews'
      ],
    });
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    const ratings = item.reviews?.map(r => r.rating) || [];
    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const reviewCount = ratings.length;

    // Fetch and attach category-specific details
    const categoryName = item.category.parentCategory?.name || item.category.name;
    const categoryDetails = await this.categoryDetailsService.getCategoryDetails(id, categoryName);
    
    const result = {
      ...item,
      categoryDetails,
      averageRating,
      reviewCount,
      owner: {
        ...item.owner,
        totalListings: await this.itemRepository.count({ where: { owner: { id: item.owner.id } } })
      }
    };
    await this.cacheManager.set(cacheKey, result, 300 * 1000); // 5 mins
    return result;
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
    const updatedItem = await this.itemRepository.save(item);
    
    // Invalidate caches
    await this.cacheManager.del('all_items');
    await this.cacheManager.del(`item:${id}`);
    if(item.category && item.category.id) {
       await this.cacheManager.del(`items_category_${item.category.id}`);
    }

    return updatedItem;
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    
    // Delete category-specific details first
    const categoryName = (item as any).category.parentCategory?.name || (item as any).category.name;
    await this.categoryDetailsService.deleteCategoryDetails(id, categoryName);
    
    const result = await this.itemRepository.remove(item as any);
    
     // Invalidate caches
    await this.cacheManager.del('all_items');
    await this.cacheManager.del(`item:${id}`);
     if((item as any).category && (item as any).category.id) {
       await this.cacheManager.del(`items_category_${(item as any).category.id}`);
    }

    return result;
  }

  async findWithinBounds(
    bounds: { neLat: number; neLng: number; swLat: number; swLng: number },
    categoryId?: number,
    filters?: any
  ) {
    const { neLat, neLng, swLat, swLng } = bounds;

    const queryBuilder = this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.address', 'address')
      .leftJoinAndSelect('item.pricings', 'pricing')
      .leftJoin('item.reviews', 'review')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .addSelect('AVG(review.rating)', 'averageRating')
      .where('address.lat BETWEEN :swLat AND :neLat', { swLat, neLat })
      .andWhere('address.lng BETWEEN :swLng AND :neLng', { swLng, neLng });

    if (categoryId) {
      // Get all subcategories recursively
      const subcategories = await this.categoryRepository.query(`
        WITH RECURSIVE cat_tree AS (
          SELECT id FROM categories WHERE id = $1
          UNION ALL
          SELECT c.id FROM categories c
          INNER JOIN cat_tree ct ON c.parent_category_id = ct.id
        )
        SELECT id FROM cat_tree
      `, [categoryId]);
      const categoryIds = subcategories.map((c: any) => c.id);
      queryBuilder.andWhere('item.category_id IN (:...categoryIds)', { categoryIds });

      // Dynamic Filter logic (similar to findAll)
      const category = await this.categoryRepository.findOne({ 
        where: { id: categoryId },
        relations: ['parentCategory']
      });

      if (category && filters && Object.keys(filters).length > 0) {
        const categoryName = (category.parentCategory?.name || category.name).toLowerCase();
        
        let detailTable = '';
        if (categoryName.includes('vehicle')) detailTable = 'vehicle_details';
        else if (categoryName.includes('electronic')) detailTable = 'electronics_details';
        else if (categoryName.includes('home')) detailTable = 'home_details';
        else if (categoryName.includes('fashion')) detailTable = 'fashion_details';
        else if (categoryName.includes('sport')) detailTable = 'sports_details';

        if (detailTable) {
          queryBuilder.leftJoinAndSelect(`item.${detailTable.replace(/_([a-z])/g, (g) => g[1].toUpperCase())}`, 'details');
          
          // Filter out global filters (access, condition, distance) - only apply category-specific filters
          const globalFilterKeys = ['access', 'condition', 'distance'];
          Object.keys(filters).forEach((key) => {
            if (!globalFilterKeys.includes(key)) {
              const val = filters[key];
              if (val !== undefined && val !== null && val !== '') {
                 queryBuilder.andWhere(`details.${key} = :${key}`, { [key]: val });
              }
            }
          });
        }
      }
    }

    queryBuilder.groupBy('item.id')
      .addGroupBy('address.id')
      .addGroupBy('pricing.id');

    const items = await queryBuilder.getRawMany();

    // Map to lightweight DTO
    return items.map(item => ({
      id: item.item_id,
      title: item.item_title,
      price: item.pricing_price || 0,
      latitude: parseFloat(item.address_lat as any),
      longitude: parseFloat(item.address_lng as any),
      averageRating: parseFloat(item.averageRating) || 0,
      reviewCount: parseInt(item.reviewCount, 10) || 0,
    }));
  }
}
