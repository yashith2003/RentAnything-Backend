//RentAnything-Backend/src/user/entities/individual-user.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('individual_users')
export class IndividualUser {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.individualUser)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'address', nullable: true })
  address: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'location', nullable: true })
  location: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
