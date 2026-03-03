//RentAnything-Backend/src/item/entities/home-details.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';

@Entity('home_details')
export class HomeDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'property_type' })
  propertyType: string;

  @Column({ name: 'number_of_rooms' })
  numberOfRooms: number;

  @Column({ name: 'number_of_bathrooms' })
  numberOfBathrooms: number;

  @Column()
  area: string;

  @Column({ name: 'is_furnished', default: false })
  isFurnished: boolean;

  @Column({ type: 'simple-json', nullable: true })
  amenities: string[];

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
