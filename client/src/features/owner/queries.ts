import { useQuery } from "@tanstack/react-query";
import { getOwnerProfile, listOwnerBookings } from "@/lib/api/client";

export function useOwnerProfileQuery() {
  return useQuery({
    queryKey: ["owner-profile"],
    queryFn: getOwnerProfile,
  });
}

export function useOwnerBookingsQuery() {
  return useQuery({
    queryKey: ["owner-bookings"],
    queryFn: listOwnerBookings,
  });
}
