//src/chat/chat.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatThread } from './entities/chat-thread.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatThread)
    private readonly threadRepository: Repository<ChatThread>,
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createThread(itemId: number, buyerId: number, sellerId: number): Promise<ChatThread> {
    const thread = this.threadRepository.create({
      item: { id: itemId },
      buyer: { id: buyerId },
      seller: { id: sellerId },
    });
    return this.threadRepository.save(thread);
  }

  async saveMessage(threadId: number, senderId: number, content: string): Promise<ChatMessage> {
    const message = this.messageRepository.create({
      thread: { id: threadId },
      sender: { id: senderId },
      content,
    });
    const savedMessage = await this.messageRepository.save(message);
    
    // Invalidate/Update cache for this thread's messages
    await this.cacheManager.del(`thread_${threadId}_messages`);
    
    return savedMessage;
  }

  async getThreadMessages(threadId: number): Promise<ChatMessage[]> {
    const cacheKey = `thread_${threadId}_messages`;
    const cachedMessages = await this.cacheManager.get<ChatMessage[]>(cacheKey);

    if (cachedMessages) {
      return cachedMessages;
    }

    const messages = await this.messageRepository.find({
      where: { thread: { id: threadId } },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });

    await this.cacheManager.set(cacheKey, messages, 3600); // Cache for 1 hour
    return messages;
  }

  async getUserThreads(userId: number): Promise<ChatThread[]> {
    return this.threadRepository.find({
      where: [{ buyer: { id: userId } }, { seller: { id: userId } }],
      relations: ['item', 'buyer', 'seller'],
    });
  }
}
