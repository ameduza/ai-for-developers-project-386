import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelBooking,
  createBooking,
  getBooking,
  listGuestBookingTypes,
  listGuestTimeSlots,
} from "@/lib/api/client";
import { QUERY_KEYS } from "@/lib/constants";

export function useGuestBookingTypesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.GUEST_BOOKING_TYPES,
    queryFn: listGuestBookingTypes,
  });
}

export function useGuestTimeSlotsQuery(bookingTypeId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.GUEST_TIME_SLOTS, bookingTypeId],
    queryFn: () => {
      if (!bookingTypeId) {
        throw new Error("A booking type id is required to load time slots");
      }

      return listGuestTimeSlots(bookingTypeId);
    },
    enabled: Boolean(bookingTypeId),
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.GUEST_TIME_SLOTS,
      });
    },
  });
}

export function useBookingQuery(bookingId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEYS.GUEST_BOOKING, bookingId],
    queryFn: () => {
      if (!bookingId) {
        throw new Error("A booking id is required to load a booking");
      }

      return getBooking(bookingId);
    },
    enabled: Boolean(bookingId),
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: (_data, bookingId) => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.GUEST_BOOKING, bookingId],
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GUEST_TIME_SLOTS });
    },
  });
}
