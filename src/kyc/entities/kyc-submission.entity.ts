//src/kyc/entities/kyc-submission.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { KycDocument } from './kyc-document.entity';
import { KycStatus } from '../enums/kyc.enums';

@Entity('kyc_submissions')
export class KycSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', unique: true })
  userId: number;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.NOT_STARTED,
    name: 'overall_status'
  })
  overallStatus: KycStatus;

  @OneToMany(() => KycDocument, (doc: any) => doc.submission)
  documents: KycDocument[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
