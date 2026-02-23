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

  async createThread(itemId: number, userIdA: number, userIdB: number): Promise<ChatThread> {
    const userOneId = Math.min(userIdA, userIdB);
    const userTwoId = Math.max(userIdA, userIdB);

    // Check if thread already exists
    const existingThread = await this.threadRepository.findOne({
      where: {
        itemId: itemId,
        userOneId: userOneId,
        userTwoId: userTwoId,
      },
    });

    if (existingThread) {
      return existingThread;
    }

    const thread = this.threadRepository.create({
      itemId: itemId,
      userOneId: userOneId,
      userTwoId: userTwoId,
    });
    const savedThread = await this.threadRepository.save(thread);
    
    // Invalidate user threads cache for both participants
    await this.cacheManager.del(`user_${userOneId}_threads`);
    await this.cacheManager.del(`user_${userTwoId}_threads`);
    
    return savedThread;
  }

  async saveMessage(threadId: number, senderId: number, content: string): Promise<ChatMessage> {
    const message = this.messageRepository.create({
      thread: { id: threadId },
      sender: { id: senderId },
      content,
    });
    const savedMessage = await this.messageRepository.save(message);
    
    // Reload with relations for broadcast
    const broadcastMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'thread'],
    });
    
    // Update lastMessageId in thread
    await this.threadRepository.update(threadId, { lastMessageId: savedMessage.id });
    
    // Invalidate/Update cache for this thread
    await this.cacheManager.del(`thread_${threadId}_messages`);
    await this.cacheManager.del(`thread_${threadId}_details`);
    
    // Invalidate thread lists for participants to update inbox
    const thread = await this.threadRepository.findOne({ where: { id: threadId } });
    if (thread) {
      await this.cacheManager.del(`user_${thread.userOneId}_threads`);
      await this.cacheManager.del(`user_${thread.userTwoId}_threads`);
    }
    
    return broadcastMessage!;
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

    await this.cacheManager.set(cacheKey, messages, 3600 * 1000); // Cache for 1 hour
    return messages;
  }

  async getUserThreads(userId: number): Promise<ChatThread[]> {
    const cacheKey = `user_${userId}_threads`;
    const cachedThreads = await this.cacheManager.get<ChatThread[]>(cacheKey);

    if (cachedThreads) {
      return cachedThreads;
    }

    const threads = await this.threadRepository.find({
      where: [{ userOne: { id: userId } }, { userTwo: { id: userId } }],
      relations: ['item', 'userOne', 'userTwo'],
    });

    await this.cacheManager.set(cacheKey, threads, 300 * 1000); // 5 minutes
    return threads;
  }

  async getThreadDetails(threadId: number): Promise<ChatThread | null> {
    const cacheKey = `thread_${threadId}_details`;
    const cachedThread = await this.cacheManager.get<ChatThread>(cacheKey);

    if (cachedThread) {
      return cachedThread;
    }

    const thread = await this.threadRepository.findOne({
      where: { id: threadId },
      relations: ['item', 'userOne', 'userTwo'],
    });

    if (thread) {
      await this.cacheManager.set(cacheKey, thread, 3600 * 1000); // Cache for 1 hour
    }
    
    return thread;
  }
}
