import { DefaultService, OpenAPI } from "@/lib/api/generated";
import type { CreateBookingType } from "@/lib/api/generated";
import { getApiBaseUrl } from "@/lib/env";

export function configureApiClient() {
  OpenAPI.BASE = getApiBaseUrl();
  OpenAPI.WITH_CREDENTIALS = false;
  OpenAPI.CREDENTIALS = "omit";
}

export function listGuestBookingTypes() {
  return DefaultService.bookingTypesListBookingTypes();
}

// Owner routes
export function getOwnerProfile() {
  return DefaultService.ownerRoutesGetOwner();
}

export function listOwnerBookingTypes() {
  return DefaultService.ownerRoutesListBookingTypes();
}

export function createOwnerBookingType(bookingType: CreateBookingType) {
  return DefaultService.ownerRoutesCreateBookingType({
    requestBody: bookingType,
  });
}
