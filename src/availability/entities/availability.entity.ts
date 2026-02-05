//src/availability/entities/availability.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Item } from '../../item/entities/item.entity';

@Entity('availability')
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Item, (item) => item.availabilities)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ type: 'date', name: 'available_date' })
  availableDate: string;

  @Column({ type: 'time', name: 'start_time', nullable: true })
  startTime: string;

  @Column({ type: 'time', name: 'end_time', nullable: true })
  endTime: string;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;
}
