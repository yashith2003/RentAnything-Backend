//RentAnything-Backend/src/chat/entities/chat-message.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChatThread } from './chat-thread.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'thread_id' })
  threadId: number;

  @ManyToOne(() => ChatThread, (thread) => thread.messages)
  @JoinColumn({ name: 'thread_id' })
  thread: ChatThread;

  @Column({ name: 'sender_id' })
  senderId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'attachments', type: 'simple-array', nullable: true })
  attachments: string[];

  @Column({ name: 'attachment_names', type: 'simple-array', nullable: true })
  attachmentNames: string[];

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
