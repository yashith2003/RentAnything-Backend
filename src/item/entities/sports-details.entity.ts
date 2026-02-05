//src/item/entities/sports-details.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';

@Entity('sports_details')
export class SportsDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'sport_type' })
  sportType: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
