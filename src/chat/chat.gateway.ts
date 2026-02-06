//src/chat/chat.gateway.ts

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
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() threadId: string, @ConnectedSocket() client: Socket) {
    client.join(`thread_${threadId}`);
    return { event: 'joinedRoom', data: threadId };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { threadId: number; senderId: number; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const savedMessage = await this.chatService.saveMessage(data.threadId, data.senderId, data.content);
    
    // Broadcast to the room
    this.server.to(`thread_${data.threadId}`).emit('newMessage', savedMessage);
    
    return savedMessage;
  }
}
