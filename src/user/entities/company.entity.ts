//RentAnything-Backend/src/user/entities/company.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.company)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column({ name: 'company_registration_number' })
  registrationNumber: string;

  @Column({ name: 'address', nullable: true })
  address: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'location', nullable: true })
  location: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
