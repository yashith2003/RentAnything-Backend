//RentAnything-Backend/src/item/entities/item-interaction.entity.ts


import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index, JoinColumn } from 'typeorm';
import { Item } from './item.entity';
import { User } from '../../user/entities/user.entity';

export enum InteractionType {
  VIEW = 'VIEW',
  CALL = 'CALL',
  CHAT = 'CHAT',
}

@Entity('item_interactions')
@Index(['item', 'userId', 'dayKey', 'type'], { unique: true, where: '"user_id" IS NOT NULL' })
@Index(['item', 'sessionId', 'dayKey', 'type'], { unique: true, where: '"session_id" IS NOT NULL' })
export class ItemInteraction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({
    type: 'enum',
    enum: InteractionType,
  })
  type: InteractionType;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ name: 'day_key' })
  dayKey: string; // YYYY-MM-DD

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
