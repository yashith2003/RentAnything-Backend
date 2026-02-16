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

  @Column({ name: 'fuel_type' })
  fuelType: string;

  @Column({ nullable: true })
  color: string;

  @Column({ name: 'registration_document', nullable: true })
  registrationDocument: string;

  @Column({ name: 'insurance_document', nullable: true })
  insuranceDocument: string;

  @Column({ name: 'revenue_license', nullable: true })
  revenueLicense: string;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
  deliveryFee: number;

  @Column({ name: 'driver_available', default: false })
  driverAvailable: boolean;

  @Column({ name: 'driver_name', nullable: true })
  driverName: string;

  @Column({ name: 'driver_gender', nullable: true })
  driverGender: string;

  @Column({ name: 'driver_license', nullable: true })
  driverLicense: string;

  @Column({ name: 'driver_fee', type: 'decimal', precision: 10, scale: 2, nullable: true })
  driverFee: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
