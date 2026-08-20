import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOwnerProfile,
  listOwnerBookingTypes,
  listOwnerUpcomingBookings,
  createOwnerBookingType,
} from "@/lib/api/client";
import type { CreateBookingType } from "@/lib/api/generated";

export function useOwnerProfileQuery() {
  return useQuery({
    queryKey: ["owner-profile"],
    queryFn: getOwnerProfile,
  });
}

export function useOwnerBookingTypesQuery() {
  return useQuery({
    queryKey: ["owner-booking-types"],
    queryFn: listOwnerBookingTypes,
  });
}

export function useOwnerUpcomingBookingsQuery() {
  return useQuery({
    queryKey: ["owner-upcoming-bookings"],
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
        queryKey: ["owner-booking-types"],
      });
    },
  });
}
