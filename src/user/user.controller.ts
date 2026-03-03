//RentAnything-Bacekend/src/user/user.controller.ts

import { Controller, Get, Put, Post, UseGuards, Request, Body, UseInterceptors, UploadedFile, BadRequestException, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ImageProcessingService } from '../common/services/image-processing.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.userService.findOne(req.user.id);
  }

  @Get(':id/public')
  @ApiOperation({ summary: 'Get a public user profile by ID' })
  async getPublicProfile(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  async updateProfile(@Request() req: any) {
    const body = req.body;
    console.log(`[UserController] RAW body for user ${req.user.id}:`, JSON.stringify(body));
    return this.userService.update(req.user.id, body);
  }

  @Post('upload-dp')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        return cb(new BadRequestException('Only image files (jpg, jpeg, png, webp) are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload profile display picture — saves to uploads/dp/:userId/' })
  async uploadDp(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file was uploaded.');
    }
    
    // Generate a unique path for the DP
    const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
    const relativePath = `dp/${req.user.id}/${randomName}.jpeg`;

    const savedPath = await this.imageProcessingService.processAndSave(file.buffer, relativePath, {
      format: 'jpeg',
      quality: 82,
      maxWidth: 800,
    });

    console.log(`[UserController] DP uploaded for user ${req.user.id}:`, savedPath);
    return { url: savedPath };
  }
}
