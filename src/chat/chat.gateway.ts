//RentAnything-Backend/src/chat/chat.gateway.ts

import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        console.warn(`[ChatGateway] Connection rejected for ${client.id}: No token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;
      await this.cacheManager.set(`user_presence:${userId}`, 'online', 60000);
      this.server.emit('userStatus', { userId, status: 'online' });

      console.log(`[ChatGateway] User ${userId} identified via JWT on connect: ${client.id}`);
    } catch (err) {
      console.warn(`[ChatGateway] Connection rejected for ${client.id}: Invalid token`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      await this.cacheManager.del(`user_presence:${userId}`);
      this.server.emit('userStatus', { userId, status: 'offline' });
      console.log(`[ChatGateway] User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('checkStatus')
  async handleCheckStatus(@MessageBody() userId: number) {
    const status = await this.cacheManager.get(`user_presence:${userId}`);
    return { status: status === 'online' ? 'online' : 'offline' };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() threadId: string, @ConnectedSocket() client: Socket) {
    client.join(`thread_${threadId}`);
    console.log(`[ChatGateway] Client ${client.data.userId} joined room thread_${threadId}`);
    return { event: 'joinedRoom', data: threadId };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() threadId: string, @ConnectedSocket() client: Socket) {
    client.leave(`thread_${threadId}`);
    console.log(`[ChatGateway] Client ${client.data.userId} left room thread_${threadId}`);
    return { event: 'leftRoom', data: threadId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { threadId: number; content: string; attachments?: string[]; attachmentNames?: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.data.userId;
    if (!senderId) {
      console.warn(`[ChatGateway] sendMessage rejected: No userId for socket ${client.id}`);
      return;
    }

    console.log(`[ChatGateway] [MSG_RECEIVE] From user ${senderId} to thread ${data.threadId}:`, {
      content: data.content,
      attachmentsCount: data.attachments?.length || 0,
      attachments: data.attachments,
      attachmentNames: data.attachmentNames
    });

    const savedMessage = await this.chatService.saveMessage(
      data.threadId, 
      senderId, 
      data.content, 
      data.attachments,
      data.attachmentNames
    );
    
    // Broadcast to the room
    this.server.to(`thread_${data.threadId}`).emit('newMessage', savedMessage);
    
    return savedMessage;
  }
}
