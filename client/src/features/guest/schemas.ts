import { z } from 'zod';

export const createBookingSchema = z.object({
  bookingTypeId: z.string().min(1, 'A booking type is required'),
  slotStart: z.string().min(1, 'A time slot start is required'),
  slotEnd: z.string().min(1, 'A time slot end is required'),
  guestName: z.string().trim().min(1, 'Enter your name'),
  guestEmail: z
    .string()
    .trim()
    .min(1, 'Enter your email')
    .pipe(z.email('Enter a valid email address')),
});

export type CreateBookingFormData = z.infer<typeof createBookingSchema>;
