//RentAnything-Backend/src/item/item.service.ts

import { Injectable, Inject, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { ItemInteraction, InteractionType } from './entities/item-interaction.entity';
import { Review } from '../review/entities/review.entity';
import { Synonym } from './entities/synonym.entity';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item) private itemRepository: Repository<Item>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @InjectRepository(ItemPricing) private pricingRepository: Repository<ItemPricing>,
    @InjectRepository(Availability) private availabilityRepository: Repository<Availability>,
    @InjectRepository(ItemInteraction) private interactionRepository: Repository<ItemInteraction>,
    @InjectRepository(Review) private reviewRepository: Repository<Review>,
    @InjectRepository(Synonym) private synonymRepository: Repository<Synonym>,
    private categoryDetailsService: CategoryDetailsService,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
  ) {}

  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        result[key] = this.sortObjectKeys(obj[key]);
        return result;
      }, {});
  }

  private async clearItemsCache() {
    // Basic clearing, ideally more specific
    // For cache-manager v5+, store might be accessed differently or use stores
    const keys = await (this.cacheManager as any).store.keys('items:*');
    for (const key of keys) {
      await this.cacheManager.del(key);
    }
  }

  async create(dto: CreateItemDto, ownerId: number | string) {
    if (typeof ownerId === 'string' && ownerId.startsWith('guest')) {
      throw new UnauthorizedException('Guests cannot create listings. Please signup.');
    }

    const numericOwnerId = Number(ownerId);
    try {
      console.log(`[ItemService] Creating item: ${dto.title} for owner: ${numericOwnerId}`);
      
      const item = this.itemRepository.create({
        ...dto,
        owner: { id: numericOwnerId } as any,
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

      await this.clearItemsCache();

      return savedItem;
    } catch (error) {
      console.error('[ItemService] Failed to create item:', error);
      throw error;
    }
  }

  async findAll(categoryId?: number, filters: any = {}): Promise<Item[]> {
    const { page, limit, excludeOwnerId, ownerId, excludeId, lat, lng, distance, ...otherFilters } = filters;
    const sortedFilters = this.sortObjectKeys(filters);
    const cacheKey = `items:list:${categoryId || 'all'}:${JSON.stringify(sortedFilters)}`;
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
      .leftJoinAndSelect('item.pricings', 'pricing');

    if (lat && lng && distance) {
      const radiusInKm = parseFloat(distance.replace(/[^\d.]/g, '')) || 5;
      // Haversine formula for distance calculation in SQL
      queryBuilder.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(address.lat)) * cos(radians(address.lng) - radians(:lng)) + sin(radians(:lat)) * sin(radians(address.lat)))) <= :radius`,
        { lat, lng, radius: radiusInKm }
      );
    }

    if (excludeOwnerId) {
      const numericExcludeId = Number(excludeOwnerId);
      if (!isNaN(numericExcludeId)) {
        queryBuilder.andWhere('owner.id != :excludeOwnerId', { excludeOwnerId: numericExcludeId });
      }
    }

    if (filters?.priceMin !== undefined) {
      queryBuilder.andWhere('pricing.price >= :priceMin', { priceMin: filters.priceMin });
    }

    if (filters?.priceMax !== undefined) {
      queryBuilder.andWhere('pricing.price <= :priceMax', { priceMax: filters.priceMax });
    }

    // New Filters: Brand, Accessibility, Warranty
    if (filters?.brand) {
      // Check across all potential detail tables - simpler to use dynamic join approach if category is known
      // or join all if not, but here we usually have category context if brand is used
      queryBuilder.andWhere('(details.brand ILIKE :brand OR details.brand ILIKE :brand)', { brand: `%${filters.brand}%` });
    }

    if (filters?.accessibility) {
      queryBuilder.andWhere('item.accessibility ILIKE :access', { access: `%${filters.accessibility}%` });
    }

    if (filters?.warrantyOnly) {
      // Custom warranty logic: excluding "no", "-", null, or empty
      queryBuilder.andWhere(
        "details.warranty IS NOT NULL AND details.warranty != '' AND LOWER(details.warranty) != 'no' AND details.warranty != '-'",
      );
    }

    if (ownerId) {
      const numericOwnerId = Number(ownerId);
      if (!isNaN(numericOwnerId)) {
        queryBuilder.andWhere('owner.id = :ownerId', { ownerId: numericOwnerId });
      } else {
        // If ownerId is a guest string, it won't have any items anyway
        queryBuilder.andWhere('1=0'); 
      }
    }

    if (excludeId) {
      queryBuilder.andWhere('item.id != :excludeId', { excludeId });
    }

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
          
          // Filter out global filters (access, condition, distance, ownerId, excludeId, excludeOwnerId) - only apply category-specific filters
          const globalFilterKeys = ['access', 'condition', 'distance', 'ownerId', 'excludeId', 'excludeOwnerId', 'page', 'limit', 'cat', 'priceMin', 'priceMax', 'minRating', 'location'];
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

    // Sorting
    queryBuilder.orderBy('item.createdAt', 'DESC');

    // Pagination
    const take = limit ? +limit : 20;
    const skip = page ? (page - 1) * take : 0;
    queryBuilder.take(take).skip(skip);

    const items = await queryBuilder.getRawAndEntities();

    // Fetch review stats separately for these owners to align with Service Provider Reputation
    const ownerIds = Array.from(new Set(items.entities.map(e => e.owner?.id).filter(id => !!id)));
    let reviewStats = [];
    if (ownerIds.length > 0) {
      reviewStats = await this.reviewRepository
        .createQueryBuilder('r')
        .select('r.owner_id', 'owner_id')
        .addSelect('COUNT(r.id)', 'count')
        .addSelect('AVG(r.rating)', 'avg_rating')
        .where('r.owner_id IN (:...ownerIds)', { ownerIds })
        .groupBy('r.owner_id')
        .getRawMany();
    }

    const reviewStatsMap = new Map();
    reviewStats.forEach((rs: any) => {
      reviewStatsMap.set(rs.owner_id, rs);
    });

    let result = items.entities.map((entity) => {
      const stats = reviewStatsMap.get(entity.owner?.id);
      return {
        ...entity,
        reviewCount: parseInt(stats?.count || '0', 10),
        averageRating: parseFloat(stats?.avg_rating || '0'),
      };
    });

    // Apply Rating Filter in JS
    if (filters?.ratingMin !== undefined || filters?.ratingMax !== undefined) {
      result = result.filter(item => {
        const rating = item.averageRating;
        const minVal = filters.ratingMin !== undefined ? filters.ratingMin : 0;
        const maxVal = filters.ratingMax !== undefined ? filters.ratingMax : 5;
        return rating >= minVal && rating <= maxVal;
      });
    }

    await this.cacheManager.set(cacheKey, result, 300); // 5 minutes cache
    return result as any;
  }


  async findMyItems(ownerId: number | string) {
    if (typeof ownerId === 'string' && ownerId.startsWith('guest')) {
      return [];
    }
    return this.itemRepository.find({
      where: { owner: { id: Number(ownerId) } },
      relations: ['category', 'address', 'owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyItemsWithReviewStats(ownerId: number | string) {
    if (typeof ownerId === 'string' && ownerId.startsWith('guest')) {
      return [];
    }
    const numericOwnerId = Number(ownerId);
    const queryBuilder = this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.address', 'address')
      .leftJoinAndSelect('item.pricings', 'pricing')
      .leftJoin('item.reviews', 'review')
      .addSelect('COUNT(review.id)', 'reviewCount')
      .addSelect('AVG(review.rating)', 'averageRating')
      .where('item.owner_id = :ownerId', { ownerId: numericOwnerId })
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

  async findByOwner(ownerId: number | string) {
    if (typeof ownerId === 'string' && ownerId.startsWith('guest')) {
      return [];
    }
    return this.itemRepository.find({
      where: { owner: { id: Number(ownerId) } },
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
    await this.clearItemsCache();
    await this.cacheManager.del(`item:${id}`);

    return updatedItem;
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    
    // Delete category-specific details first
    const categoryName = (item as any).category.parentCategory?.name || (item as any).category.name;
    await this.categoryDetailsService.deleteCategoryDetails(id, categoryName);
    
    const result = await this.itemRepository.remove(item as any);
    
     // Invalidate caches
    await this.clearItemsCache();
    await this.cacheManager.del(`item:${id}`);

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
      .leftJoinAndSelect('item.owner', 'owner')
      .leftJoinAndSelect('owner.individualUser', 'individualUser')
      .leftJoinAndSelect('owner.company', 'company')
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

    // Fetch review stats separately for these owners to align with Service Provider Reputation
    const ownerIds = Array.from(new Set(items.map(i => i.item_owner_id).filter(id => !!id)));
    let reviewStats = [];
    if (ownerIds.length > 0) {
      reviewStats = await this.reviewRepository
        .createQueryBuilder('r')
        .select('r.owner_id', 'owner_id')
        .addSelect('COUNT(r.id)', 'count')
        .addSelect('AVG(r.rating)', 'avg_rating')
        .where('r.owner_id IN (:...ownerIds)', { ownerIds })
        .groupBy('r.owner_id')
        .getRawMany();
    }

    const reviewStatsMap = new Map();
    reviewStats.forEach((rs: any) => {
      reviewStatsMap.set(rs.owner_id, rs);
    });

    // Map to lightweight DTO
    return items.map(item => {
      const stats = reviewStatsMap.get(item.item_owner_id);
      return {
        id: item.item_id,
        title: item.item_title,
        price: item.pricing_price || 0,
        latitude: parseFloat(item.address_lat as any),
        longitude: parseFloat(item.address_lng as any),
        averageRating: parseFloat(stats?.avg_rating || '0'),
        reviewCount: parseInt(stats?.count || '0', 10),
      };
    });
  }

  async recordInteraction(itemId: number, type: string, userId?: number | string, sessionId?: string) {
    const dayKey = new Date().toISOString().split('T')[0];
    
    // Anti-spam: Upsert interaction to avoid multiple views from same user/session on the same day
    try {
      await this.interactionRepository.createQueryBuilder()
        .insert()
        .into(ItemInteraction)
        .values({
          item: { id: itemId } as any,
          type: type as InteractionType,
          userId: typeof userId === 'number' ? userId : undefined,
          sessionId,
          dayKey,
        })
        .orIgnore() // TypeORM/Postgres way to handle unique constraint conflicts
        .execute();
    } catch (e) {
      // Ignore duplicates if orIgnore() isn't enough
      console.log(`[Interaction] Duplicate interaction ignored: ${itemId}, ${type}, ${dayKey}`);
    }
  }

  async findTrending(categoryId?: number, filters: any = {}): Promise<Item[]> {
    const { page = 1, limit = 20, search, excludeOwnerId, excludeId } = filters;
    const skip = (page - 1) * limit;

    const cacheKey = `items:trending:${categoryId || 'all'}:${JSON.stringify(filters)}`;
    const cachedItems = await this.cacheManager.get<Item[]>(cacheKey);
    if (cachedItems) return cachedItems;

    // Advanced SQL for decay and momentum
    const scoreSubquery = `
      SELECT 
        item_id,
        SUM(
          (CASE 
            WHEN type = 'VIEW' THEN 1.0 
            WHEN type = 'CHAT' THEN 1.5 
            WHEN type = 'CALL' THEN 2.0 
            ELSE 0 END) * 
          EXP(-(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0) / 7.0)
        ) as decayed14,
        SUM(
          CASE 
            WHEN created_at >= NOW() - INTERVAL '3 days' 
            THEN (CASE WHEN type = 'VIEW' THEN 1.0 WHEN type = 'CHAT' THEN 1.5 WHEN type = 'CALL' THEN 2.0 ELSE 0 END * EXP(-(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0) / 3.0)) 
            ELSE 0 
          END
        ) as recent3,
        SUM(
          CASE 
            WHEN created_at >= NOW() - INTERVAL '6 days' AND created_at < NOW() - INTERVAL '3 days' 
            THEN (CASE WHEN type = 'VIEW' THEN 1.0 WHEN type = 'CHAT' THEN 1.5 WHEN type = 'CALL' THEN 2.0 ELSE 0 END * EXP(-(EXTRACT(EPOCH FROM (NOW() - (created_at + INTERVAL '3 days'))) / 86400.0) / 3.0)) 
            ELSE 0 
          END
        ) as prev3
      FROM item_interactions
      WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY item_id
    `;

    const queryBuilder = this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.owner', 'owner')
      .leftJoinAndSelect('owner.individualUser', 'individualUser')
      .leftJoinAndSelect('owner.company', 'company')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.address', 'address')
      .leftJoinAndSelect('item.pricings', 'pricing')
      // Join the score subquery
      .leftJoin(`(${scoreSubquery})`, 'scores', 'scores.item_id = item.id')
      .addSelect('COALESCE((scores.decayed14 + 0.3 * (scores.recent3 - scores.prev3)), 0)', 'final_score');

    if (excludeOwnerId) {
      const numericExcludeId = Number(excludeOwnerId);
      if (!isNaN(numericExcludeId)) {
        queryBuilder.andWhere('owner.id != :excludeOwnerId', { excludeOwnerId: numericExcludeId });
      }
    }

    if (excludeId) {
      queryBuilder.andWhere('item.id != :excludeId', { excludeId });
    }

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
    }

    if (search) {
      queryBuilder.andWhere('(item.title ILIKE :search OR item.description ILIKE :search)', { search: `%${search}%` });
    }

    queryBuilder
      .orderBy('final_score', 'DESC')
      .addOrderBy('item.created_at', 'DESC')
      .limit(limit)
      .offset(skip);

    const items = await queryBuilder.getRawAndEntities();
    
    // Extract unique entities and their raw scores
    const entitiesMap = new Map();
    items.entities.forEach(entity => {
      entitiesMap.set(entity.id, entity);
    });

    const scoresMap = new Map();
    items.raw.forEach(r => {
      scoresMap.set(r.item_id, r.final_score);
    });

    // Fetch review stats separately for these owners to align with Service Provider Reputation
    const ownerIds: number[] = Array.from(new Set(items.entities.map(e => e.owner?.id).filter(id => !!id)));
    let reviewStats = [];
    if (ownerIds.length > 0) {
      reviewStats = await this.reviewRepository
        .createQueryBuilder('r')
        .select('r.owner_id', 'owner_id')
        .addSelect('COUNT(r.id)', 'count')
        .addSelect('AVG(r.rating)', 'avg_rating')
        .where('r.owner_id IN (:...ownerIds)', { ownerIds })
        .groupBy('r.owner_id')
        .getRawMany();
    }

    const reviewStatsMap = new Map();
    reviewStats.forEach((rs: any) => {
      reviewStatsMap.set(rs.owner_id, rs);
    });

    const result = Array.from(entitiesMap.values()).map(entity => {
      const stats = reviewStatsMap.get(entity.owner?.id);
      return {
        ...entity,
        reviewCount: parseInt(stats?.count || '0', 10),
        averageRating: parseFloat(stats?.avg_rating || '0'),
        trendingScore: parseFloat(scoresMap.get(entity.id) || '0'),
      };
    });

    await this.cacheManager.set(cacheKey, result, 120);
    return result as any;
  }

  async search(query: string, categoryId?: number, page: number = 1, limit: number = 20, filters: any = {}) {
    if (!query || query.trim().length === 0) {
      return this.findAll(categoryId, { page, limit, ...filters });
    }

    const { lat, lng, distance } = filters;
    const normalizedQuery = query.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const sortedFilters = this.sortObjectKeys(filters);
    const cacheKey = `search:${normalizedQuery}:${categoryId || 'all'}:${page}:${limit}:${JSON.stringify(sortedFilters)}`;
    const cachedResults = await this.cacheManager.get(cacheKey);
    if (cachedResults) return cachedResults;

    // Expand search query with synonyms
    const synonyms = await this.synonymRepository.find();
    let expandedQuery = normalizedQuery;
    for (const s of synonyms) {
      if (normalizedQuery.includes(s.word)) {
        expandedQuery += ' | ' + s.synonyms.join(' | ');
      }
    }

    // Format query for tsquery (prefix search)
    const formattedQuery = expandedQuery
      .split(' ')
      .filter((word) => word.length > 0 && word !== '|')
      .map((word) => `${word}:*`)
      .join(' | ');

    const skip = (page - 1) * limit;

    // Hybrid search query
    const results = await this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.owner', 'owner')
      .leftJoinAndSelect('owner.individualUser', 'individualUser')
      .leftJoinAndSelect('owner.company', 'company')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.address', 'address')
      .leftJoinAndSelect('item.pricings', 'pricing')
      .addSelect(`ts_rank_cd(item.search_vector, to_tsquery('english', :tsQuery))`, 'tsRank')
      .addSelect(`similarity(item.title, :rawQuery)`, 'titleSim')
      // Rating and Popularity boost subquery
      .leftJoin(subQuery => {
          return subQuery
              .select('item_id', 'item_id')
              .addSelect('COUNT(*)', 'view_count')
              .from(ItemInteraction, 'ii')
              .where("ii.type = 'VIEW'")
              .groupBy('item_id');
      }, 'pop', 'pop.item_id = item.id')
      .leftJoin(subQuery => {
          return subQuery
              .select('owner_id', 'owner_id')
              .addSelect('AVG(rating)', 'avg_rating')
              .addSelect('COUNT(*)', 'rev_count')
              .from(Review, 'r')
              .groupBy('owner_id');
      }, 'rev', 'rev.owner_id = item.owner_id')
      .addSelect(`COALESCE(pop.view_count, 0)`, 'popularity')
      .addSelect(`COALESCE(rev.avg_rating, 0)`, 'rating')
      .where(`(item.search_vector @@ to_tsquery('english', :tsQuery) OR item.title % :rawQuery)`, { 
          tsQuery: formattedQuery, 
          rawQuery: normalizedQuery 
      });

    if (filters?.priceMin !== undefined) {
      results.andWhere('pricing.price >= :priceMin', { priceMin: filters.priceMin });
    }
    if (filters?.priceMax !== undefined) {
      results.andWhere('pricing.price <= :priceMax', { priceMax: filters.priceMax });
    }

    if (filters?.brand) {
      results.andWhere('details.brand ILIKE :brand', { brand: `%${filters.brand}%` });
    }

    if (filters?.accessibility) {
      results.andWhere('item.accessibility ILIKE :access', { access: `%${filters.accessibility}%` });
    }

    if (filters?.warrantyOnly) {
      results.andWhere(
        "details.warranty IS NOT NULL AND details.warranty != '' AND LOWER(details.warranty) != 'no' AND details.warranty != '-'",
      );
    }

    if (lat && lng && distance) {
        const radiusInKm = parseFloat(distance.replace(/[^\d.]/g, '')) || 5;
        results.andWhere(
            `(6371 * acos(cos(radians(:lat)) * cos(radians(address.lat)) * cos(radians(address.lng) - radians(:lng)) + sin(radians(:lat)) * sin(radians(address.lat)))) <= :radius`,
            { lat, lng, radius: radiusInKm }
        );
    }

    if (categoryId) {
        // Get all subcategories recursively (simplified for search)
        results.andWhere('item.category_id = :categoryId', { categoryId });
    }

    // Comprehensive score logic
    results.addSelect(`
        (0.7 * ts_rank_cd(item.search_vector, to_tsquery('english', :tsQuery))) + 
        (0.3 * similarity(item.title, :rawQuery)) + 
        (0.01 * LEAST(COALESCE(pop.view_count, 0), 100)) + 
        (0.05 * COALESCE(rev.avg_rating, 0))
    `, 'finalScore');

    results.orderBy('item.search_vector @@ to_tsquery(\'english\', :tsQuery)', 'DESC') // Exact matches first
      .addOrderBy('"finalScore"', 'DESC')
      .limit(limit)
      .offset(skip);

    const rawAndEntities = await results.getRawAndEntities();

    let finalResult = rawAndEntities.entities.map((entity, index) => {
      const raw = rawAndEntities.raw[index];
      return {
        ...entity,
        searchScore: parseFloat(raw.finalScore),
        reviewCount: parseInt(raw.rev_count || '0', 10),
        averageRating: parseFloat(raw.rating || '0'),
      };
    });

    // Apply Rating Filter in JS
    if (filters?.ratingMin !== undefined || filters?.ratingMax !== undefined) {
      finalResult = finalResult.filter(item => {
        const rating = item.averageRating;
        const minVal = filters.ratingMin !== undefined ? filters.ratingMin : 0;
        const maxVal = filters.ratingMax !== undefined ? filters.ratingMax : 5;
        return rating >= minVal && rating <= maxVal;
      });
    }

    await this.cacheManager.set(cacheKey, finalResult, 120); // 120s TTL as requested
    return finalResult;
  }
}
