import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Review } from './entities/review.entity';
import { Item } from '../item/entities/item.entity';
import { Rental } from '../rental/entities/rental.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Item, Rental])],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
