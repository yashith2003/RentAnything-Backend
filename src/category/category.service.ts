//RentAnything-Backend/src/category/category.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager from 'cache-manager';
import { Category } from './entities/category.entity';
import type { FilterConfig } from './entities/filter-config.entity';
import { FilterConfig as FilterConfigEntity } from './entities/filter-config.entity';

import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(FilterConfigEntity)
    private filterConfigRepository: Repository<FilterConfig>,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager.Cache,
  ) {}

  async findFilters(categoryId: number): Promise<any[]> {
    const cacheKey = `category:filters:${categoryId}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const filters = await this.categoryRepository.query(`
      WITH RECURSIVE cat_tree AS (
        SELECT id, parent_category_id FROM categories WHERE id = $1
        UNION ALL
        SELECT c.id, c.parent_category_id FROM categories c
        INNER JOIN cat_tree ct ON c.id = ct.parent_category_id
      )
      SELECT id, label, key, type, options, category_id as "categoryId" FROM filter_configs WHERE category_id IN (SELECT id FROM cat_tree)
    `, [categoryId]);
    
    await this.cacheManager.set(cacheKey, filters, 600 * 1000); 
    return filters;
  }

  async create(dto: CreateCategoryDto) {
    const category = this.categoryRepository.create({
      name: dto.name,
      parentCategory: dto.parentId ? ({ id: dto.parentId } as any) : null,
    });
    const saved = await this.categoryRepository.save(category);
    
    // Invalidate category list cache
    await this.cacheManager.del('category:all');
    return saved;
  }

  async findAll() {
    const cacheKey = 'category:all';
    const cached = await this.cacheManager.get<Category[]>(cacheKey);
    if (cached) return cached;

    const categories = await this.categoryRepository.find({
      relations: ['subCategories', 'parentCategory'],
    });
    
    await this.cacheManager.set(cacheKey, categories, 600 * 1000); // 10 mins
    return categories;
  }
}
