//RentAnything-Backend/src/kyc/kyc.service.ts

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { KycSubmission } from './entities/kyc-submission.entity';
import { KycDocument } from './entities/kyc-document.entity';
import { KycStatus, KycDocumentType } from './enums/kyc.enums';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycSubmission)
    private readonly submissionRepository: Repository<KycSubmission>,
    @InjectRepository(KycDocument)
    private readonly documentRepository: Repository<KycDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getStatus(userId: number | string) {
    if (typeof userId === 'string' && userId.startsWith('guest')) {
      return {
        overallStatus: KycStatus.NOT_STARTED,
        items: {},
      };
    }
    const numericUserId = Number(userId);
    const cacheKey = `kyc_status_${numericUserId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    let submission = await this.submissionRepository.findOne({
      where: { userId: numericUserId },
      relations: ['documents'],
    });

    if (!submission) {
      submission = await this.submissionRepository.save(
        this.submissionRepository.create({ userId: numericUserId, overallStatus: KycStatus.NOT_STARTED })
      );
      submission.documents = [];
    }

    const docMap = {};
    Object.values(KycDocumentType).forEach((type) => {
      const doc = submission.documents.find((d) => d.type === type);
      docMap[type] = doc
        ? { status: doc.status, fileUrl: doc.fileUrl, rejectionReasons: doc.rejectionReasons }
        : { status: KycStatus.NOT_STARTED };
    });

    const result = {
      overallStatus: submission.overallStatus,
      items: docMap,
    };

    await this.cacheManager.set(cacheKey, result, 300 * 1000); // 5 minutes
    return result;
  }

  async uploadDocument(userId: number | string, type: KycDocumentType, fileUrl: string) {
    if (typeof userId === 'string' && userId.startsWith('guest')) {
      throw new Error('Guests cannot upload KYC documents');
    }
    const numericUserId = Number(userId);
    let submission = await this.submissionRepository.findOne({ where: { userId: numericUserId } });
    if (!submission) {
      submission = await this.submissionRepository.save(
        this.submissionRepository.create({ userId: numericUserId, overallStatus: KycStatus.PENDING })
      );
    }

    let document = await this.documentRepository.findOne({
      where: { submissionId: submission.id, type },
    });

    if (document) {
      document.fileUrl = fileUrl;
      document.status = KycStatus.PENDING;
      document.rejectionReasons = [];
      await this.documentRepository.save(document);
    } else {
      document = await this.documentRepository.save(
        this.documentRepository.create({
          submissionId: submission.id,
          type,
          fileUrl,
          status: KycStatus.PENDING,
        })
      );
    }

    await this.recalculateOverallStatus(submission.id);
    await this.cacheManager.del(`kyc_status_${numericUserId}`);

    return document;
  }

  private async recalculateOverallStatus(submissionId: number) {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ['documents', 'user'],
    });
    if (!submission) return;

    const docs = submission.documents;
    let newStatus = KycStatus.NOT_STARTED;

    if (docs.length === 0) {
      newStatus = KycStatus.NOT_STARTED;
    } else if (docs.some((d) => d.status === KycStatus.REJECTED)) {
      newStatus = KycStatus.REJECTED;
    } else if (docs.some((d) => d.status === KycStatus.PENDING)) {
      newStatus = KycStatus.PENDING;
    } else {
      const hasSelfie = docs.some(d => d.type === KycDocumentType.FACE_SELFIE && d.status === KycStatus.VERIFIED);
      const hasId = docs.some(d => 
        [KycDocumentType.NIC_FRONT, KycDocumentType.PASSPORT, KycDocumentType.DRIVING_LICENSE].includes(d.type) && 
        d.status === KycStatus.VERIFIED
      );
      
      if (hasSelfie && hasId) {
        newStatus = KycStatus.VERIFIED;
      } else {
        newStatus = KycStatus.PENDING;
      }
    }

    submission.overallStatus = newStatus;
    await this.submissionRepository.save(submission);

    // Sync with User status if possible
    if (submission.user) {
      submission.user.status = newStatus.toLowerCase(); // keep it consistent with 'pending'
      await this.submissionRepository.manager.save(submission.user);
      
      // Invalidate user cache
      await this.cacheManager.del(`user_profile_${submission.userId}`);
    }
  }
}
