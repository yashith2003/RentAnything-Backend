//src/chat/chat.controller.ts

import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('thread')
  @ApiOperation({ summary: 'Create a new chat thread for an item' })
  async createThread(
    @Body('itemId') itemId: number,
    @Body('sellerId') sellerId: number,
    @Req() req: any,
  ) {
    const buyerId = req.user.id;
    return this.chatService.createThread(itemId, buyerId, sellerId);
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
}
