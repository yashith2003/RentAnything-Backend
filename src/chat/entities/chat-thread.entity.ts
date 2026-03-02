//RentAnything-Backend/src/chat/entities/chat-thread.entity.ts

import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn, Unique, Column } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Item } from '../../item/entities/item.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_threads')
@Unique(['userOneId', 'userTwoId'])
export class ChatThread {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'item_id' })
  itemId: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'user_one_id' })
  userOneId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_one_id' })
  userOne: User;

  @Column({ name: 'user_two_id' })
  userTwoId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_two_id' })
  userTwo: User;

  @OneToMany(() => ChatMessage, (message) => message.thread)
  messages: ChatMessage[];

  @Column({ name: 'last_message_id', nullable: true })
  lastMessageId: number;

  @ManyToOne(() => ChatMessage)
  @JoinColumn({ name: 'last_message_id' })
  lastMessage: ChatMessage;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
