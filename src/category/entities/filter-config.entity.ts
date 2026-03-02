// src/category/entities/filter-config.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './category.entity';

export enum FilterInputType {
  SELECT = 'select',
  MULTI_SELECT = 'multi-select',
  RANGE = 'range',
  TOGGLE = 'toggle',
  TEXT = 'text',
  SLIDER = 'slider',
  DATE = 'date',
  COLOR_SELECT = 'color-select',
}

@Entity('filter_configs')
export class FilterConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  label: string; // UI Label e.g. "Fuel Type"

  @Column()
  key: string; // Backend field name e.g. "fuelType"

  @Column({
    type: 'enum',
    enum: FilterInputType,
    default: FilterInputType.SELECT,
  })
  type: FilterInputType;

  @Column({ type: 'json', nullable: true })
  options: any[]; // For select/multi-select e.g. ["Petrol", "Diesel", "Electric"]

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id' })
  categoryId: number;
}
