//src/item/entities/fashion-details.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';

@Entity('fashion_details')
export class FashionDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column()
  size: string;

  @Column()
  gender: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  material: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
