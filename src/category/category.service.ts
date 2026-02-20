//src/category/category.service.ts

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

    const filters = await this.filterConfigRepository.find({
      where: { categoryId },
    });
    
    await this.cacheManager.set(cacheKey, filters, 600 * 1000); // 10 mins
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
