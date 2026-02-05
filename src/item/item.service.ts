//src/item/item.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
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
    const where: any = {};
    if (categoryId) {
      where.category = { id: categoryId };
    }
    return this.itemRepository.find({
      where,
      relations: ['owner', 'category', 'address'],
    });
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
    return this.itemRepository.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    return this.itemRepository.remove(item);
  }
}
