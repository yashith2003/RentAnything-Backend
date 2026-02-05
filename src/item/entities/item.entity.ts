//src/item/entities/item.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import { Address } from '../../address/entities/address.entity';
import { Availability } from '../../availability/entities/availability.entity';
import { ItemPricing } from '../../pricing/entities/item-pricing.entity';

export enum ItemStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  MAINTENANCE = 'maintenance',
  UNAVAILABLE = 'unavailable',
}

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToOne(() => Category, (category) => category.items)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Address)
  @JoinColumn({ name: 'address_id' })
  address: Address;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  condition: string;

  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.AVAILABLE,
  })
  status: ItemStatus;

  @Column({ name: 'delivery_available', default: false })
  deliveryAvailable: boolean;

  @Column({ name: 'pickup_available', default: true })
  pickupAvailable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Availability, (availability) => availability.item)
  availabilities: Availability[];

  @OneToMany(() => ItemPricing, (pricing) => pricing.item)
  pricings: ItemPricing[];
}
