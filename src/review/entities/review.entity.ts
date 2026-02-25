import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Item } from '../../item/entities/item.entity';

@Entity('reviews')
@Unique(['reviewerId', 'itemId'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ name: 'reviewer_id' })
  reviewerId: number;

  @ManyToOne(() => User, user => user.reviewsGiven)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'item_id' })
  itemId: number;

  @ManyToOne(() => Item, item => item.reviews)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @ManyToOne(() => User, user => user.reviewsReceived)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
