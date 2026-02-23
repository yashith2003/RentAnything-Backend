//RentAnything-Backend/src/item/saved-item.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedItem } from './entities/saved-item.entity';
import { Item } from './entities/item.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class SavedItemService {
  constructor(
    @InjectRepository(SavedItem)
    private readonly savedItemRepository: Repository<SavedItem>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async toggle(userId: number, itemId: number) {
    const existing = await this.savedItemRepository.findOne({
      where: {
        user: { id: userId },
        item: { id: itemId },
      },
    });

    if (existing) {
      await this.savedItemRepository.delete(existing.id);
      return { saved: false };
    }

    try {
      await this.savedItemRepository.insert({
        user: { id: userId } as any,
        item: { id: itemId } as any,
      });

      return { saved: true };
    } catch (error: any) {
      // Duplicate key error (race condition protection)
      if (error.code === '23505') {
        return { saved: true };
      }

      console.error('Toggle error:', error);
      throw error;
    }
  }

  async findAll(userId: number) {
    try {
      const savedItems = await this.savedItemRepository.find({
        where: { user: { id: userId } },
        relations: [
          'item',
          'item.category',
          'item.owner',
          'item.owner.individualUser',
          'item.owner.company',
          'item.pricings',
          'item.address',
        ],
        order: { createdAt: 'DESC' },
      });

      // Strip circular relations that cause JSON.stringify to crash!
      const safeItems = savedItems.map((si) => {
        const item = si.item;
        if (item) {
          if (item.owner) {
            if (item.owner.company) delete (item.owner.company as any).user;
            if (item.owner.individualUser) delete (item.owner.individualUser as any).user;
          }
          if (item.pricings) {
            item.pricings.forEach(p => delete (p as any).item);
          }
          if (item.availabilities) {
            item.availabilities.forEach(a => delete (a as any).item);
          }
        }
        return si;
      });

      console.log(`[SavedItemService] findAll for user ${userId}: ${safeItems.length} items`);
      return safeItems;
    } catch (error: any) {
      console.error('[SavedItemService] findAll ERROR:', error.message, error.stack);
      throw new BadRequestException(error.message);
    }
  }

  async isSaved(userId: number, itemId: number) {
    const count = await this.savedItemRepository.count({
      where: { 
        user: { id: userId }, 
        item: { id: itemId } 
      },
    });
    return count > 0;
  }
}

