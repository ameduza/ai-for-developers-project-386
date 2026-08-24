// Generated from typespec/main.tsp. Do not edit directly.

export interface Owner {
  id: string;
  name: string;
  bio: string;
}

export interface BookingType {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
}

export interface CreateBookingType {
  title: string;
  description: string;
  durationMinutes: number;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Guest {
  name: string;
  email: string;
}

export interface Booking {
  id: string;
  bookingType: BookingType;
  timeSlot: TimeSlot;
  guest: Guest;
}

export interface CreateBooking {
  bookingTypeId: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  guestName: string;
  guestEmail: string;
}

export type ErrorCode =
  | "VALIDATION_FAILED"
  | "BOOKING_TYPE_NOT_FOUND"
  | "BOOKING_NOT_FOUND"
  | "SLOT_NOT_AVAILABLE"
  | "SLOT_IN_PAST"
  | "SLOT_NOT_ON_GRID"
  | "INTERNAL_ERROR";

export interface Error {
  code: ErrorCode;
  message: string;
}
