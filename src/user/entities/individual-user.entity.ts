//src/user/entities/individual-user.entity.ts

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

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
