//RentAnything-Bacekend/src/user/user.controller.ts

import { Controller, Get, Put, Post, UseGuards, Request, Body, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.userService.findOne(req.user.id);
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
    storage: diskStorage({
      destination: (req: any, file, cb) => {
        const dpDir = join(process.cwd(), 'uploads', 'dp', String(req.user.id));
        if (!fs.existsSync(dpDir)) {
          fs.mkdirSync(dpDir, { recursive: true });
        }
        cb(null, dpDir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
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
    const url = `uploads/dp/${req.user.id}/${file.filename}`;
    console.log(`[UserController] DP uploaded for user ${req.user.id}:`, url);
    return { url };
  }
}
