//RentAnything-Backend/src/item/entities/electronics-details.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';

@Entity('electronics_details')
export class ElectronicsDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column({ nullable: true })
  warranty: string;

  @Column({ type: 'text', nullable: true })
  specifications: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
