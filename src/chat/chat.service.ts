//RentAnything-Backend/src/chat/chat.service.ts

import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
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

  async createThread(itemId: number, userIdA: number | string, userIdB: number | string): Promise<ChatThread> {
    if ((typeof userIdA === 'string' && userIdA.startsWith('guest')) || 
        (typeof userIdB === 'string' && userIdB.startsWith('guest'))) {
      throw new Error('Guests cannot participate in chats');
    }

    const userOneId = Math.min(Number(userIdA), Number(userIdB));
    const userTwoId = Math.max(Number(userIdA), Number(userIdB));

    // Check if thread already exists for this user pair
    const existingThread = await this.threadRepository.findOne({
      where: {
        userOneId: userOneId,
        userTwoId: userTwoId,
      },
    });

    if (existingThread) {
      return existingThread;
    }

    const thread = this.threadRepository.create({
      itemId: itemId, // First item starting the conversation
      userOneId: userOneId,
      userTwoId: userTwoId,
    });
    const savedThread = await this.threadRepository.save(thread);
    
    // Invalidate user threads cache for both participants
    await this.cacheManager.del(`user_${userOneId}_threads`);
    await this.cacheManager.del(`user_${userTwoId}_threads`);
    
    return savedThread;
  }

  async saveMessage(
    threadId: number, 
    senderId: number | string, 
    content: string, 
    attachments?: string[], 
    attachmentNames?: string[],
    type: string = 'text'
  ): Promise<ChatMessage> {
    if (typeof senderId === 'string' && senderId.startsWith('guest')) {
      throw new Error('Guests cannot send messages');
    }
    const numericSenderId = Number(senderId);
    console.log(`[ChatService] [SAVE_MESSAGE] Thread ${threadId}, Sender ${numericSenderId}, Attachments:`, attachments);
    const message = this.messageRepository.create({
      thread: { id: threadId },
      threadId, // Explicitly set for hooks/relations if needed
      sender: { id: numericSenderId },
      content,
      type,
      attachments,
      attachmentNames,
    });
    const savedMessage = await this.messageRepository.save(message);
    
    // Update lastMessageId in thread
    await this.threadRepository.update(threadId, { lastMessageId: savedMessage.id });
    
    // Reload with relations for broadcast
    const broadcastMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: [
        'sender',
        'sender.individualUser',
        'sender.company',
        'thread',
      ],
    });

    console.log(`[ChatService] Message saved with ID ${savedMessage.id}. Attachments count:`, savedMessage.attachments?.length || 0);
    
    // Invalidate caches
    await this.cacheManager.del(`thread_${threadId}_messages`);
    const threadDetails = await this.threadRepository.findOne({ where: { id: threadId } });
    if (threadDetails) {
      await this.cacheManager.del(`user_${threadDetails.userOneId}_threads`);
      await this.cacheManager.del(`user_${threadDetails.userTwoId}_threads`);
      await this.cacheManager.del(`thread_${threadId}_details`);
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
      relations: ['sender', 'sender.individualUser', 'sender.company'],
    });

    console.log(`[ChatService] getThreadMessages ${threadId} attachments:`, messages.map(m => m.attachments));

    await this.cacheManager.set(cacheKey, messages, 3600 * 1000); // Cache for 1 hour
    return messages;
  }

  async getUserThreads(userId: number | string): Promise<any[]> {
    if (typeof userId === 'string' && userId.startsWith('guest')) {
      return [];
    }
    const numericUserId = Number(userId);
    const cacheKey = `user_${numericUserId}_threads`;
    const cachedThreads = await this.cacheManager.get<any[]>(cacheKey);

    if (cachedThreads) {
      return cachedThreads;
    }

    const threads = await this.threadRepository.find({
      where: [{ userOneId: numericUserId }, { userTwoId: numericUserId }],
      relations: [
        'item',
        'userOne',
        'userOne.individualUser',
        'userOne.company',
        'userTwo',
        'userTwo.individualUser',
        'userTwo.company',
        'lastMessage',
      ],
      order: { updatedAt: 'DESC' },
    });

    const threadsWithUnread = await Promise.all(threads.map(async (thread) => {
      const unreadCount = await this.messageRepository.count({
        where: {
          threadId: thread.id,
          senderId: Not(numericUserId),
          isRead: false,
        },
      });
      return { ...thread, unreadCount };
    }));

    await this.cacheManager.set(cacheKey, threadsWithUnread, 300 * 1000); // 5 minutes
    return threadsWithUnread;
  }

  async getThreadDetails(threadId: number): Promise<ChatThread | null> {
    const cacheKey = `thread_${threadId}_details`;
    const cachedThread = await this.cacheManager.get<ChatThread>(cacheKey);

    if (cachedThread) {
      return cachedThread;
    }

    const thread = await this.threadRepository.findOne({
      where: { id: threadId },
      relations: [
        'item',
        'userOne',
        'userOne.individualUser',
        'userOne.company',
        'userTwo',
        'userTwo.individualUser',
        'userTwo.company',
      ],
    });

    if (thread) {
      await this.cacheManager.set(cacheKey, thread, 3600 * 1000); // Cache for 1 hour
    }
    
    return thread;
  }

  async markThreadAsRead(threadId: number, userId: number | string): Promise<void> {
    if (typeof userId === 'string' && userId.startsWith('guest')) {
      return;
    }
    const numericUserId = Number(userId);
    await this.messageRepository.update(
      { threadId, senderId: Not(numericUserId), isRead: false },
      { isRead: true }
    );
    await this.cacheManager.del(`user_${numericUserId}_threads`);
    await this.cacheManager.del(`thread_${threadId}_messages`);
  }

  async bulkShareItem(senderId: number | string, threadIds: number[], itemId: number): Promise<ChatMessage[]> {
    const results: ChatMessage[] = [];
    for (const threadId of threadIds) {
      // Content for item_share could be the item ID or a deep link
      const content = `rentanything://item/${itemId}`;
      const message = await this.saveMessage(threadId, senderId, content, [], [], 'item_share');
      results.push(message);
    }
    return results;
  }
}
