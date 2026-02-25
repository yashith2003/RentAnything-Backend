//RentAnything-Backend/src/user/entities/user.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IndividualUser } from './individual-user.entity';
import { Company } from './company.entity';
import { Address } from '../../address/entities/address.entity';
import { KycSubmission } from '../../kyc/entities/kyc-submission.entity';
import { Review } from '../../review/entities/review.entity';

export enum UserRole {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.INDIVIDUAL,
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => IndividualUser, (individual) => individual.user, { cascade: true })
  individualUser: IndividualUser;

  @OneToOne(() => Company, (company) => company.user, { cascade: true })
  company: Company;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];

  @OneToMany(() => Review, (review) => review.reviewer)
  reviewsGiven: Review[];

  @OneToMany(() => Review, (review) => review.owner)
  reviewsReceived: Review[];
}
