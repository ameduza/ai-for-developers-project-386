import { z } from 'zod';

export const createBookingTypeSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be at most 500 characters'),
  durationMinutes: z
    .number()
    .int('Duration must be a whole number')
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration must be at most 480 minutes (8 hours)'),
});

export type CreateBookingTypeFormData = z.infer<typeof createBookingTypeSchema>;
