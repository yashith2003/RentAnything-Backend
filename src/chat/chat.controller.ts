//RentAnything-Backend/src/chat/chat.controller.ts

import { Controller, Get, Post, Body, Param, UseGuards, Req, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { ImageProcessingService } from '../common/services/image-processing.service';

const chatUploadDir = join(process.cwd(), 'uploads', 'chat');
if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  @Post('thread')
  @ApiOperation({ summary: 'Create a new chat thread for an item' })
  async createThread(
    @Body('itemId') itemId: number,
    @Body('otherUserId') otherUserId: number,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.chatService.createThread(itemId, userId, otherUserId);
  }

  @Get('threads')
  @ApiOperation({ summary: 'Get all chat threads for the current user' })
  async getUserThreads(@Req() req: any) {
    return this.chatService.getUserThreads(req.user.id);
  }

  @Get('thread/:id/messages')
  @ApiOperation({ summary: 'Get all messages in a specific thread' })
  async getThreadMessages(@Param('id') threadId: number) {
    return this.chatService.getThreadMessages(threadId);
  }

  @Get('thread/:id')
  @ApiOperation({ summary: 'Get details of a specific chat thread' })
  async getThreadDetails(@Param('id') threadId: number) {
    return this.chatService.getThreadDetails(threadId);
  }

  @Post('thread/:id/read')
  @ApiOperation({ summary: 'Mark all messages in a thread as read' })
  async markThreadAsRead(@Param('id') threadId: number, @Req() req: any) {
    return this.chatService.markThreadAsRead(threadId, req.user.id);
  }
  
  @Post('bulk-share')
  @ApiOperation({ summary: 'Share an item to multiple chat threads' })
  async bulkShareItem(
    @Body('threadIds') threadIds: number[],
    @Body('itemId') itemId: number,
    @Req() req: any,
  ) {
    return this.chatService.bulkShareItem(req.user.id, threadIds, itemId);
  }

  @Post('thread/:threadId/upload-attachments')
  @ApiOperation({ summary: 'Upload multiple chat attachments (images or PDFs)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 5, {
    storage: diskStorage({
      destination: (req: any, file, cb) => {
        // Path params are parsed by NestJS/Express BEFORE multer destination is called
        // if the route is defined with them.
        const paramId = req.params?.threadId;
        const headerId = req.headers['x-thread-id'];
        const queryId = req.query?.threadId;

        console.log(`[ChatController] [UPLOAD] Discovery on path 'thread/:threadId/upload-attachments':`, {
          paramId,
          headerId,
          queryId,
          url: req.url
        });

        const threadId = paramId || headerId || queryId || 'unknown';
        console.log(`[ChatController] [UPLOAD] Final destination thread: ${threadId}`);
        
        const threadDir = join(chatUploadDir, threadId.toString());
        if (!fs.existsSync(threadDir)) {
          fs.mkdirSync(threadDir, { recursive: true });
        }
        cb(null, threadDir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
      const ext = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return cb(new BadRequestException('Only images (jpg, png, webp) and PDFs are allowed'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  }))
  @ApiOperation({ summary: 'Upload multiple chat attachments (images or PDFs)' })
  async uploadAttachments(@UploadedFiles() files: Express.Multer.File[], @Req() req: any) {
    const threadId = req.params.threadId || req.headers['x-thread-id'] || 'unknown';
    console.log(`[ChatController] [SUCCESS] Received ${files?.length} files for thread: ${threadId}`);
    
    if (!files || files.length === 0) {
      throw new BadRequestException('No files were uploaded.');
    }

    const processedUrls = await Promise.all(
      files.map(async (file) => {
        const ext = extname(file.originalname).toLowerCase();
        // If it's an image, process it. If it's a PDF, keep as is.
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
          return this.imageProcessingService.processAndReplace(file.path, {
            format: 'webp',
            quality: 80,
            maxWidth: 1280,
          });
        }
        // Return relative path for PDF
        return `uploads/chat/${threadId}/${file.filename}`;
      })
    );
    
    return {
      urls: processedUrls,
      originalNames: files.map(file => file.originalname)
    };
  }
}
