//src/kyc/kyc.service.ts

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

  async getStatus(userId: number) {
    const cacheKey = `kyc_status_${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    let submission = await this.submissionRepository.findOne({
      where: { userId },
      relations: ['documents'],
    });

    if (!submission) {
      submission = await this.submissionRepository.save(
        this.submissionRepository.create({ userId, overallStatus: KycStatus.NOT_STARTED })
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

  async uploadDocument(userId: number, type: KycDocumentType, fileUrl: string) {
    let submission = await this.submissionRepository.findOne({ where: { userId } });
    if (!submission) {
      submission = await this.submissionRepository.save(
        this.submissionRepository.create({ userId, overallStatus: KycStatus.PENDING })
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
    await this.cacheManager.del(`kyc_status_${userId}`);

    return document;
  }

  private async recalculateOverallStatus(submissionId: number) {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ['documents'],
    });
    if (!submission) return;

    const docs = submission.documents;
    if (docs.length === 0) {
      submission.overallStatus = KycStatus.NOT_STARTED;
    } else if (docs.some((d) => d.status === KycStatus.REJECTED)) {
      submission.overallStatus = KycStatus.REJECTED;
    } else if (docs.some((d) => d.status === KycStatus.PENDING)) {
      submission.overallStatus = KycStatus.PENDING;
    } else {
      // Logic for VERIFIED: Let's say FACE_SELFIE and at least one ID doc (NIC or Passport or License) are required
      const hasSelfie = docs.some(d => d.type === KycDocumentType.FACE_SELFIE && d.status === KycStatus.VERIFIED);
      const hasId = docs.some(d => 
        [KycDocumentType.NIC_FRONT, KycDocumentType.PASSPORT, KycDocumentType.DRIVING_LICENSE].includes(d.type) && 
        d.status === KycStatus.VERIFIED
      );
      
      if (hasSelfie && hasId) {
        submission.overallStatus = KycStatus.VERIFIED;
      } else {
        submission.overallStatus = KycStatus.PENDING;
      }
    }

    await this.submissionRepository.save(submission);
  }
}
