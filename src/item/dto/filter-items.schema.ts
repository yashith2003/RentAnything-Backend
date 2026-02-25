
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
}).catchall(z.any());

export type FilterItemsDto = z.infer<typeof FilterItemsSchema>;
