//src/rental/entities/rental.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RentalRequest } from './rental-request.entity';
import { IncidentReport } from '../../incident/entities/incident-report.entity';

export enum RentalStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('rentals')
export class Rental {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => RentalRequest, (request) => request.rental)
  @JoinColumn({ name: 'rental_request_id' })
  rentalRequest: RentalRequest;

  @Column({ name: 'start_at', type: 'timestamp' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamp', nullable: true })
  endAt: Date;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: RentalStatus,
    default: RentalStatus.ONGOING,
  })
  status: RentalStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => IncidentReport, (incident) => incident.rental)
  incidents: IncidentReport[];
}
