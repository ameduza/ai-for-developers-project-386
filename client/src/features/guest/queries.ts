import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBooking,
  listGuestBookingTypes,
  listGuestTimeSlots,
} from "@/lib/api/client";

export function useGuestBookingTypesQuery() {
  return useQuery({
    queryKey: ["guest-booking-types"],
    queryFn: listGuestBookingTypes,
  });
}

export function useGuestTimeSlotsQuery(bookingTypeId: string | undefined) {
  return useQuery({
    queryKey: ["guest-time-slots", bookingTypeId],
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
        queryKey: ["guest-time-slots"],
      });
    },
  });
}
