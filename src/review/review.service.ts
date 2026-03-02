//RentAnything-Backend/src/review/review.service.ts

import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Review } from './entities/review.entity';
import { Item } from '../item/entities/item.entity';
import { Rental, RentalStatus } from '../rental/entities/rental.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(reviewerId: number | string, createReviewDto: CreateReviewDto) {
    if (typeof reviewerId === 'string' && reviewerId.startsWith('guest')) {
      throw new BadRequestException('Guests cannot leave reviews. Please signup.');
    }
    const numericReviewerId = Number(reviewerId);
    const { itemId, rating, feedback } = createReviewDto;

    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: ['owner'],
    });

    if (!item) {
      throw new BadRequestException('Item not found');
    }

    if (item.owner.id === numericReviewerId) {
       throw new BadRequestException('You cannot review your own item');
    }

    // Restriction removed: Anyone can now review an owner

    // Restriction removed: Anyone can now review multiple times

    console.log(`[ReviewService] Attempting upsert: reviewerId=${reviewerId}, itemId=${itemId}, ownerId=${item.owner.id}`);

    let review = await this.reviewRepository.findOne({
      where: { reviewerId: numericReviewerId, itemId },
    });

    if (review) {
      console.log(`[ReviewService] Found existing review ${review.id}, updating...`);
      review.rating = rating;
      review.feedback = feedback ?? null;
    } else {
      console.log(`[ReviewService] No existing review found, creating new one...`);
      review = this.reviewRepository.create({
        rating,
        feedback,
        reviewerId: numericReviewerId,
        itemId,
        ownerId: item.owner.id,
      });
    }

    const savedReview = await this.reviewRepository.save(review);
    console.log(`[ReviewService] Saved review: id=${savedReview.id}, ownerId=${item.owner.id}`);

    // Deterministic Cache Invalidation
    try {
        const ownerId = item.owner.id;
        // Primary review list keys (Default pagination)
        await this.cacheManager.del(`item:${itemId}:reviews:page:1:limit:10`);
        await this.cacheManager.del(`user:${ownerId}:reviews:page:1:limit:10`);
        
        console.log(`[ReviewService] Invalidated cache for item ${itemId} and owner ${ownerId}`);
    } catch (e) {
      console.warn('Cache invalidation failed:', e);
    }

    return {
        ...savedReview,
        ownerId: savedReview.ownerId,
    };
  }

  async getItemReviews(itemId: number, page: number = 1, limit: number = 10) {
    const cacheKey = `item:${itemId}:reviews:page:${page}:limit:${limit}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'totalReviews')
      .addSelect('AVG(review.rating)', 'averageRating')
      .where('review.itemId = :itemId', { itemId })
      .getRawOne();

    console.log(`[ReviewService] Raw item stats for item ${itemId}:`, stats);

    const starCountsRaw = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.itemId = :itemId', { itemId })
      .groupBy('review.rating')
      .getRawMany();

    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    starCountsRaw.forEach(sc => {
      const rating = parseInt(sc.rating || sc.review_rating || '0', 10);
      const count = parseInt(sc.count || sc.review_count || '0', 10);
      if (rating >= 1 && rating <= 5) {
        starCounts[rating] = count;
      }
    });

    const totalReviewsNum = parseInt(String(stats?.totalReviews || stats?.totalreviews || '0'), 10);
    const averageRatingNum = parseFloat(String(stats?.averageRating || stats?.averagerating || '0'));

    const [reviews, _] = await this.reviewRepository.findAndCount({
      where: [
        { itemId, feedback: Not(IsNull()) },
        { itemId, feedback: Not('') }
      ],
      relations: ['reviewer', 'reviewer.individualUser', 'reviewer.company'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    // Additional secondary filter in case 'Not("")' behavior is inconsistent with NULLs in TypeORM
    const filteredResults = reviews.filter(r => r.feedback && r.feedback.trim().length > 0);

    const formattedReviews = filteredResults.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.feedback,
      name: r.reviewer?.individualUser?.fullName || r.reviewer?.company?.companyName || 'Anonymous',
      image: r.reviewer?.individualUser?.avatarUrl || r.reviewer?.company?.logoUrl || null,
      reviewerStatus: r.reviewer?.status,
      createdAt: r.createdAt
    }));

     const result = {
      totalReviews: totalReviewsNum,
      averageRating: averageRatingNum,
      starCounts,
      reviews: formattedReviews,
    };
    
    // await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  async getUserReviews(userId: number | string, page: number = 1, limit: number = 10) {
    if (typeof userId === 'string' && userId.startsWith('guest')) {
      return {
        totalReviews: 0,
        averageRating: 0,
        starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        reviews: [],
      };
    }
    const numericUserId = Number(userId);
    const cacheKey = `user:${numericUserId}:reviews:page:${page}:limit:${limit}`;
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'totalReviews')
      .addSelect('AVG(review.rating)', 'averageRating')
      .where('review.ownerId = :userId', { userId: numericUserId })
      .getRawOne();
    
    console.log(`[ReviewService] Raw user stats for owner ${numericUserId}:`, stats);

    const starCountsRaw = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.ownerId = :userId', { userId: numericUserId })
      .groupBy('review.rating')
      .getRawMany();

    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    starCountsRaw.forEach(sc => {
      const rating = parseInt(sc.rating || sc.review_rating || '0', 10);
      const count = parseInt(sc.count || sc.review_count || '0', 10);
      if (rating >= 1 && rating <= 5) {
        starCounts[rating] = count;
      }
    });

    const totalReviewsNum = parseInt(String(stats?.totalReviews || stats?.totalreviews || '0'), 10);
    const averageRatingNum = parseFloat(String(stats?.averageRating || stats?.averagerating || '0'));

    const [reviews, _] = await this.reviewRepository.findAndCount({
      where: [
        { ownerId: numericUserId, feedback: Not(IsNull()) },
        { ownerId: numericUserId, feedback: Not('') }
      ],
      relations: ['reviewer', 'reviewer.individualUser', 'reviewer.company', 'item'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const filteredResults = reviews.filter(r => r.feedback && r.feedback.trim().length > 0);

    const formattedReviews = filteredResults.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.feedback,
      itemName: r.item?.title,
      name: r.reviewer?.individualUser?.fullName || r.reviewer?.company?.companyName || 'Anonymous',
      image: r.reviewer?.individualUser?.avatarUrl || r.reviewer?.company?.logoUrl || null,
      reviewerStatus: r.reviewer?.status,
      createdAt: r.createdAt
    }));

    const result = {
      totalReviews: totalReviewsNum,
      averageRating: averageRatingNum,
      starCounts,
      reviews: formattedReviews,
    };

    console.log(`[ReviewService] Final response for owner ${numericUserId}:`, {
      total: result.totalReviews,
      avg: result.averageRating,
      count: result.reviews.length
    });

    await this.cacheManager.set(cacheKey, result, 300000);
    return result;
  }

  async getMyReviewForItem(userId: number | string, itemId: number) {
    if (typeof userId === 'string' && userId.startsWith('guest')) {
      return null;
    }
    const numericUserId = Number(userId);
    const review = await this.reviewRepository.findOne({
      where: { reviewerId: numericUserId, itemId },
    });

    if (!review) return null;

    return {
      id: review.id,
      rating: review.rating,
      comment: review.feedback,
      createdAt: review.createdAt,
    };
  }
}
