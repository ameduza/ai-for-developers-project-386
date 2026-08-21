import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOwnerProfile,
  listOwnerBookingTypes,
  listOwnerUpcomingBookings,
  createOwnerBookingType,
} from "@/lib/api/client";
import type { CreateBookingType } from "@/lib/api/generated";
import { QUERY_KEYS } from "@/lib/constants";

export function useOwnerProfileQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.OWNER_PROFILE,
    queryFn: getOwnerProfile,
  });
}

export function useOwnerBookingTypesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.OWNER_BOOKING_TYPES,
    queryFn: listOwnerBookingTypes,
  });
}

export function useOwnerUpcomingBookingsQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.OWNER_UPCOMING_BOOKINGS,
    queryFn: listOwnerUpcomingBookings,
  });
}

export function useCreateOwnerBookingTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingType: CreateBookingType) =>
      createOwnerBookingType(bookingType),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.OWNER_BOOKING_TYPES,
      });
    },
  });
}
