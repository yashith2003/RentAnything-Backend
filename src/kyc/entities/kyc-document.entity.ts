//src/kyc/entities/kyc-document.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { KycSubmission } from './kyc-submission.entity';
import { KycStatus, KycDocumentType } from '../enums/kyc.enums';

@Entity('kyc_documents')
@Unique(['submissionId', 'type'])
export class KycDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => KycSubmission, (submission) => submission.documents)
  @JoinColumn({ name: 'submission_id' })
  submission: KycSubmission;

  @Column({ name: 'submission_id' })
  submissionId: number;

  @Column({
    type: 'enum',
    enum: KycDocumentType,
  })
  type: KycDocumentType;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.PENDING,
  })
  status: KycStatus;

  @Column({ name: 'rejection_reasons', type: 'json', nullable: true })
  rejectionReasons: string[];

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'reviewed_by_admin_id', nullable: true })
  reviewedByAdminId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
