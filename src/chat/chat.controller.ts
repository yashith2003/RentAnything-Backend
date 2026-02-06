//src/chat/chat.controller.ts

import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('thread')
  async createThread(
    @Body('itemId') itemId: number,
    @Body('sellerId') sellerId: number,
    @Req() req: any,
  ) {
    const buyerId = req.user.id;
    return this.chatService.createThread(itemId, buyerId, sellerId);
  }

  @Get('threads')
  async getUserThreads(@Req() req: any) {
    return this.chatService.getUserThreads(req.user.id);
  }

  @Get('thread/:id/messages')
  async getThreadMessages(@Param('id') threadId: number) {
    return this.chatService.getThreadMessages(threadId);
  }
}
