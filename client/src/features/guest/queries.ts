import { useQuery } from "@tanstack/react-query";
import { listGuestBookingTypes, listGuestTimeSlots } from "@/lib/api/client";

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
