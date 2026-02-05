//src/item/entities/vehicle-details.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Item } from './item.entity';

@Entity('vehicle_details')
export class VehicleDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'vehicle_number' })
  vehicleNumber: string;

  @Column({ name: 'vehicle_type' })
  vehicleType: string;

  @Column({ name: 'seating_capacity' })
  seatingCapacity: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
