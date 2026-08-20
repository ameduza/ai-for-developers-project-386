import { z } from "zod";

export const createBookingSchema = z.object({
  eventTypeId: z.string().min(1, "A booking type is required"),
  slotStart: z.string().min(1, "A time slot start is required"),
  slotEnd: z.string().min(1, "A time slot end is required"),
  guestName: z.string().min(1, "Name is required"),
  guestEmail: z
    .string()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address")),
});

export type CreateBookingFormData = z.infer<typeof createBookingSchema>;
