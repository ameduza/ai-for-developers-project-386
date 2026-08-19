import { DefaultService, OpenAPI } from "@/lib/api/generated";
import { getApiBaseUrl } from "@/lib/env";

export function configureApiClient() {
  OpenAPI.BASE = getApiBaseUrl();
  OpenAPI.WITH_CREDENTIALS = false;
  OpenAPI.CREDENTIALS = "omit";
}

export function listGuestBookingTypes() {
  return DefaultService.bookingTypesListBookingTypes();
}
