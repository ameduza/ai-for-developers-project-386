import { DefaultService, OpenAPI } from "@/lib/api/generated";
import { apiBaseUrl } from "@/lib/env";

export function configureApiClient() {
  OpenAPI.BASE = apiBaseUrl;
  OpenAPI.WITH_CREDENTIALS = false;
  OpenAPI.CREDENTIALS = "omit";
}

export function listGuestBookingTypes() {
  return DefaultService.bookingTypesListBookingTypes();
}

export function getOwnerProfile() {
  return DefaultService.ownerRoutesGetOwner();
}

export function listOwnerBookings() {
  return DefaultService.ownerRoutesListUpcomingBookings();
}
