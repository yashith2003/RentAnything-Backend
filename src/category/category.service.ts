//src/category/category.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto) {
    const category = this.categoryRepository.create({
      name: dto.name,
      parentCategory: dto.parentId ? ({ id: dto.parentId } as any) : null,
    });
    return this.categoryRepository.save(category);
  }

  async findAll() {
    return this.categoryRepository.find({
      relations: ['subCategories', 'parentCategory'],
    });
  }
}
