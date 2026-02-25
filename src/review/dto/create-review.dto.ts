//RentAnything-Backend/src/review/dto/create-review.dto.ts

import { z } from 'zod';

export const CreateReviewSchema = z.object({
  itemId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;
