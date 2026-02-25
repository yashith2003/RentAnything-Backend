//RentAnything-Backend/src/item/dto/filter-items.schema.ts


import { z } from 'zod';

export const FilterItemsSchema = z.object({
  cat: z.coerce.number().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
  distance: z.string().optional(),
  location: z.string().optional(),
  ownerId: z.coerce.number().optional(),
  excludeId: z.coerce.number().optional(),
  excludeOwnerId: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
}).catchall(z.any());

export type FilterItemsDto = z.infer<typeof FilterItemsSchema>;
