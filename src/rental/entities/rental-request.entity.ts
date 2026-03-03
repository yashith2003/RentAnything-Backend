//RentAnything-Backend/src/rental/entities/rental-request.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Item } from '../../item/entities/item.entity';
import { Rental } from './rental.entity';

export enum RentalRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('rental_requests')
export class RentalRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'renter_id' })
  renter: User;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'pickup_date', type: 'date' })
  pickupDate: Date;

  @Column({ name: 'return_date', type: 'date' })
  returnDate: Date;

  @Column({
    type: 'enum',
    enum: RentalRequestStatus,
    default: RentalRequestStatus.PENDING,
  })
  status: RentalRequestStatus;

  @CreateDateColumn({ name: 'requested_at' })
  requestedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Rental, (rental) => rental.rentalRequest)
  rental: Rental;
}
