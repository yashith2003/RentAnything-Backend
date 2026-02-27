//src/item/entities/synonym.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('synonyms')
export class Synonym {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  word: string;

  @Column({ type: 'text', array: true })
  synonyms: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
