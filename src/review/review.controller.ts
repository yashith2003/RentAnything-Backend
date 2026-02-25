//RentAnything-Backend/src/review/review.controller.ts

import { Controller, Post, Get, Body, Param, UseGuards, Request, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewSchema } from './dto/create-review.dto';
import type { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Request() req,
    @Body(new ZodValidationPipe(CreateReviewSchema)) createReviewDto: CreateReviewDto,
  ) {
    return this.reviewService.create(req.user.id, createReviewDto);
  }

  @Get('item/:itemId')
  getItemReviews(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reviewService.getItemReviews(itemId, page, limit);
  }

  @Get('user/:userId')
  getUserReviews(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reviewService.getUserReviews(userId, page, limit);
  }

  @Get('item/:itemId/my-review')
  @UseGuards(JwtAuthGuard)
  getMyReviewForItem(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Request() req,
  ) {
    return this.reviewService.getMyReviewForItem(req.user.id, itemId);
  }
}
