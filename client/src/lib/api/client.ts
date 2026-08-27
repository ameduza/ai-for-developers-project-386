import { DefaultService, OpenAPI } from '@/lib/api/generated';
import type { CreateBooking, CreateBookingType } from '@/lib/api/generated';
import { getApiBaseUrl } from '@/lib/env';

export function configureApiClient(apiBaseUrl = getApiBaseUrl()) {
  OpenAPI.BASE = apiBaseUrl;
  OpenAPI.WITH_CREDENTIALS = false;
  OpenAPI.CREDENTIALS = 'omit';
}

export function listGuestBookingTypes() {
  return DefaultService.bookingTypesListBookingTypes();
}

export function listGuestTimeSlots(bookingTypeId: string) {
  return DefaultService.bookingTypesListSlots({ id: bookingTypeId });
}

export function createBooking(booking: CreateBooking) {
  return DefaultService.bookingsCreate({ requestBody: booking });
}

export function getBooking(id: string) {
  return DefaultService.bookingsGet({ id });
}

export function cancelBooking(id: string) {
  return DefaultService.bookingsDelete({ id });
}

// Owner routes
export function getOwnerProfile() {
  return DefaultService.ownerRoutesGetOwner();
}

export function listOwnerBookingTypes() {
  return DefaultService.ownerRoutesListBookingTypes();
}

export function listOwnerUpcomingBookings() {
  return DefaultService.ownerRoutesListUpcomingBookings();
}

export function createOwnerBookingType(bookingType: CreateBookingType) {
  return DefaultService.ownerRoutesCreateBookingType({
    requestBody: bookingType,
  });
}
