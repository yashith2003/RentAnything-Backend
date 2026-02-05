//src/pricing/entities/item-pricing.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Item } from '../../item/entities/item.entity';

export enum RateType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Entity('item_pricing')
export class ItemPricing {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Item, (item) => item.pricings)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({
    type: 'enum',
    enum: RateType,
    name: 'rate_type',
  })
  rateType: RateType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'min_duration', default: 1 })
  minDuration: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
