//RentAnything-Backend/src/item/dto/filter-items.schema.ts


import { z } from 'zod';

export const FilterItemsSchema = z.object({
  cat: z.coerce.number().optional(),
  categoryId: z.coerce.number().optional(),
  category: z.coerce.number().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  ratingMin: z.coerce.number().optional(),
  ratingMax: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
  distance: z.string().optional(),
  location: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  ownerId: z.union([z.coerce.number(), z.string()]).optional(),
  excludeId: z.union([z.coerce.number(), z.string()]).optional(),
  excludeOwnerId: z.union([z.coerce.number(), z.string()]).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
}).catchall(z.any());

export type FilterItemsDto = z.infer<typeof FilterItemsSchema>;
