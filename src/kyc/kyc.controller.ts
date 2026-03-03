//RentAnything-Backend/src/kyc/kyc.controller.ts

import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { KycService } from './kyc.service';
import { KycStatus, KycDocumentType } from './enums/kyc.enums';
import { ImageProcessingService } from '../common/services/image-processing.service';
import { memoryStorage } from 'multer';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(
    private readonly kycService: KycService,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  @Get('status')
  async getStatus(@Req() req: any) {
    return this.kycService.getStatus(req.user.id);
  }

  @Post('upload/:type')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        return cb(new BadRequestException('Only image files (jpg, jpeg, png, webp) are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  async uploadDocument(
    @Param('type') type: KycDocumentType,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${type}-${uniqueSuffix}.jpeg`;
    const relativePath = `kyc/${req.user.id}/${filename}`;

    const fileUrl = await this.imageProcessingService.processAndSave(file.buffer, relativePath, {
      format: 'jpeg',
      quality: 82,
      maxWidth: 1600,
    });

    return this.kycService.uploadDocument(req.user.id, type, fileUrl);
  }

  @Get('document/:type')
  async getDocument(@Param('type') type: KycDocumentType, @Req() req: any) {
    const status: any = await this.kycService.getStatus(req.user.id);
    return status.items[type];
  }
}
