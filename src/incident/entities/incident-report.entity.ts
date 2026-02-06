//src/incident/entities/incident-report.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Rental } from '../../rental/entities/rental.entity';
import { User } from '../../user/entities/user.entity';
import { IncidentMedia } from './incident-media.entity';

export enum IncidentStatus {
  REPORTED = 'reported',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('incident_reports')
export class IncidentReport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Rental, (rental) => rental.incidents)
  @JoinColumn({ name: 'rental_id' })
  rental: Rental;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reported_by' })
  reportedBy: User;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED,
  })
  status: IncidentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => IncidentMedia, (media) => media.incident, { cascade: true })
  media: IncidentMedia[];
}
