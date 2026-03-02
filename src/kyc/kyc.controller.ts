//src/kyc/kyc.controller.ts

import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { KycService } from './kyc.service';
import { KycStatus, KycDocumentType } from './enums/kyc.enums';
import { ImageProcessingService } from '../common/services/image-processing.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

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
    storage: diskStorage({
      destination: (req: any, file, cb) => {
        const userId = req.user.id;
        const uploadPath = join(process.cwd(), 'uploads', 'kyc', userId.toString());
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const type = req.params.type;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${type}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
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
    
    const fileUrl = await this.imageProcessingService.processAndReplace(file.path, {
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
