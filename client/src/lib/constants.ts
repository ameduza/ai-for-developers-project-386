// Query keys for TanStack Query
export const QUERY_KEYS = {
  // Guest
  GUEST_BOOKING_TYPES: ['guest-booking-types'] as const,
  GUEST_TIME_SLOTS: ['guest-time-slots'] as const,
  GUEST_BOOKING: ['guest-booking'] as const,
  // Owner
  OWNER_PROFILE: ['owner-profile'] as const,
  OWNER_BOOKING_TYPES: ['owner-booking-types'] as const,
  OWNER_UPCOMING_BOOKINGS: ['owner-upcoming-bookings'] as const,
} as const;
