//RentAnything-Backend/src/item/entities/item.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import { Address } from '../../address/entities/address.entity';
import { Availability } from '../../availability/entities/availability.entity';
import { ItemPricing } from '../../pricing/entities/item-pricing.entity';
import { VehicleDetails } from './vehicle-details.entity';
import { ElectronicsDetails } from './electronics-details.entity';
import { HomeDetails } from './home-details.entity';
import { FashionDetails } from './fashion-details.entity';
import { SportsDetails } from './sports-details.entity';
import { Review } from '../../review/entities/review.entity';

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
  title: string = '';

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

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'rental_terms', type: 'text', nullable: true })
  rentalTerms: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ name: 'security_deposit', type: 'decimal', precision: 10, scale: 2, nullable: true })
  securityDeposit: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'sub_images', type: 'text', array: true, default: [] })
  subImages: string[];

  @Column({ nullable: true })
  accessibility: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'tsvector', nullable: true, select: false })
  searchVector: any;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Availability, (availability) => availability.item)
  availabilities: Availability[];

  @OneToMany(() => ItemPricing, (pricing) => pricing.item)
  pricings: ItemPricing[];

  @OneToOne(() => VehicleDetails, (details) => details.item)
  vehicleDetails: VehicleDetails;

  @OneToOne(() => ElectronicsDetails, (details) => details.item)
  electronicsDetails: ElectronicsDetails;

  @OneToOne(() => HomeDetails, (details) => details.item)
  homeDetails: HomeDetails;

  @OneToOne(() => FashionDetails, (details) => details.item)
  fashionDetails: FashionDetails;

  @OneToOne(() => SportsDetails, (details) => details.item)
  sportsDetails: SportsDetails;

  @OneToMany(() => Review, (review) => review.item)
  reviews: Review[];
}
