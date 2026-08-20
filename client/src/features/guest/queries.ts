import { useQuery } from "@tanstack/react-query";
import { listGuestBookingTypes } from "@/lib/api/client";

export function useGuestBookingTypesQuery() {
  return useQuery({
    queryKey: ["guest-booking-types"],
    queryFn: listGuestBookingTypes,
  });
}
