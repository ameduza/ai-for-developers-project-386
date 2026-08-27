import { z } from 'zod';

export const createBookingTypeSchema = z.object({
  title: z
    .string()
    .min(1, 'Enter a title')
    .min(3, 'Title must be between 3 and 100 characters')
    .max(100, 'Title must be between 3 and 100 characters'),
  description: z
    .string()
    .min(1, 'Enter a description')
    .min(10, 'Description must be between 10 and 500 characters')
    .max(500, 'Description must be between 10 and 500 characters'),
  durationMinutes: z
    .number({ error: 'Enter a duration in whole minutes' })
    .int('Enter a duration in whole minutes')
    .min(15, 'Duration must be between 15 and 480 minutes')
    .max(480, 'Duration must be between 15 and 480 minutes'),
});

export type CreateBookingTypeFormData = z.infer<typeof createBookingTypeSchema>;
