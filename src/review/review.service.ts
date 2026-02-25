import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async create(reviewerId: number, createReviewDto: CreateReviewDto) {
    const { itemId, rating, feedback } = createReviewDto;

    const item = await this.itemRepository.findOne({
      where: { id: itemId },
      relations: ['owner'],
    });

    if (!item) {
      throw new BadRequestException('Item not found');
    }

    if (item.owner.id === reviewerId) {
       throw new BadRequestException('You cannot review your own item');
    }

    // A user must have successfully completed a rental for this item to review it
    const hasCompletedRental = await this.rentalRepository.findOne({
      where: {
        rentalRequest: {
          renter: { id: reviewerId },
          item: { id: itemId },
        },
        status: RentalStatus.COMPLETED,
      },
      relations: ['rentalRequest', 'rentalRequest.renter', 'rentalRequest.item'],
    });

    if (!hasCompletedRental) {
      throw new BadRequestException('You can only review items you have successfully rented and completed');
    }

    const existingReview = await this.reviewRepository.findOne({
      where: { reviewerId, itemId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this item');
    }

    const review = this.reviewRepository.create({
      rating,
      feedback,
      reviewerId,
      itemId,
      ownerId: item.owner.id,
    });

    await this.reviewRepository.save(review);

    // Invalidate Redis cache
    const keysToInvalidate = await (this.cacheManager as any).store.keys(`item:${itemId}:reviews*`);
    for (const key of keysToInvalidate) {
       await this.cacheManager.del(key);
    }
    const ownerKeysToInvalidate = await (this.cacheManager as any).store.keys(`user:${item.owner.id}:reviews*`);
    for (const key of ownerKeysToInvalidate) {
       await this.cacheManager.del(key);
    }

    return review;
  }

  async getItemReviews(itemId: number, page: number = 1, limit: number = 10) {
    const cacheKey = `item:${itemId}:reviews:page:${page}:limit:${limit}`;
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const { totalReviews, averageRating } = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'totalReviews')
      .addSelect('AVG(review.rating)', 'averageRating')
      .where('review.item_id = :itemId', { itemId })
      .getRawOne();

    const [reviews, _] = await this.reviewRepository.findAndCount({
      where: { itemId },
      relations: ['reviewer', 'reviewer.individualUser', 'reviewer.company'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formattedReviews = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.feedback,
      name: r.reviewer?.individualUser?.fullName || r.reviewer?.company?.companyName || 'Anonymous',
      image: (r.reviewer?.individualUser as any)?.profilePicture || (r.reviewer?.company as any)?.logo || 'https://i.pravatar.cc/150',
      reviewerStatus: r.reviewer?.status,
      createdAt: r.createdAt
    }));

     const result = {
      totalReviews: parseInt(totalReviews || '0', 10),
      averageRating: parseFloat(averageRating || '0'),
      reviews: formattedReviews,
    };
    
    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  async getUserReviews(userId: number, page: number = 1, limit: number = 10) {
    const cacheKey = `user:${userId}:reviews:page:${page}:limit:${limit}`;
    const cachedData = await this.cacheManager.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const { totalReviews, averageRating } = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'totalReviews')
      .addSelect('AVG(review.rating)', 'averageRating')
      .where('review.owner_id = :userId', { userId })
      .getRawOne();

    const [reviews, _] = await this.reviewRepository.findAndCount({
      where: { ownerId: userId },
      relations: ['reviewer', 'reviewer.individualUser', 'reviewer.company', 'item'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formattedReviews = reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.feedback,
      itemName: r.item?.title,
      name: r.reviewer?.individualUser?.fullName || r.reviewer?.company?.companyName || 'Anonymous',
      image: (r.reviewer?.individualUser as any)?.profilePicture || (r.reviewer?.company as any)?.logo || 'https://i.pravatar.cc/150',
      reviewerStatus: r.reviewer?.status,
      createdAt: r.createdAt
    }));

    const result = {
      totalReviews: parseInt(totalReviews || '0', 10),
      averageRating: parseFloat(averageRating || '0'),
      reviews: formattedReviews,
    };

    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }
}
