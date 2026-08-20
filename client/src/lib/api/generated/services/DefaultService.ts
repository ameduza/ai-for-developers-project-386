/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Booking } from '../models/Booking';
import type { BookingType } from '../models/BookingType';
import type { CreateBooking } from '../models/CreateBooking';
import type { CreateBookingType } from '../models/CreateBookingType';
import type { Owner } from '../models/Owner';
import type { TimeSlot } from '../models/TimeSlot';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * List booking types visible to guests.
     * @returns any The request has succeeded.
     * @throws ApiError
     */
    public static bookingTypesListBookingTypes(): CancelablePromise<{
        items: Array<BookingType>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/booking-types',
        });
    }
    /**
     * List available time slots for a booking type within the next 14 days.
     * @returns any The request has succeeded.
     * @throws ApiError
     */
    public static bookingTypesListSlots({
        id,
    }: {
        id: string,
    }): CancelablePromise<{
        items: Array<TimeSlot>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/booking-types/{id}/slots',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Create a booking for a chosen time slot.
     * @returns Booking The request has succeeded and a new resource has been created as a result.
     * @throws ApiError
     */
    public static bookingsCreate({
        requestBody,
    }: {
        requestBody: CreateBooking,
    }): CancelablePromise<Booking> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/bookings',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `The server could not understand the request due to invalid syntax.`,
                404: `The server cannot find the requested resource.`,
                409: `The request conflicts with the current state of the server.`,
                500: `Server error`,
            },
        });
    }
    /**
     * Retrieve a booking by id (guest access).
     * @returns Booking The request has succeeded.
     * @throws ApiError
     */
    public static bookingsGet({
        id,
    }: {
        id: string,
    }): CancelablePromise<Booking> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/bookings/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `The server cannot find the requested resource.`,
                500: `Server error`,
            },
        });
    }
    /**
     * Cancel a booking (guest access).
     * @returns void
     * @throws ApiError
     */
    public static bookingsDelete({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/bookings/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `The server cannot find the requested resource.`,
                500: `Server error`,
            },
        });
    }
    /**
     * Retrieve the predefined owner profile.
     * @returns Owner The request has succeeded.
     * @throws ApiError
     */
    public static ownerRoutesGetOwner(): CancelablePromise<Owner> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/owner',
        });
    }
    /**
     * List all booking types (owner view).
     * @returns any The request has succeeded.
     * @throws ApiError
     */
    public static ownerRoutesListBookingTypes(): CancelablePromise<{
        items: Array<BookingType>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/owner/booking-types',
        });
    }
    /**
     * Create a new booking type.
     * @returns BookingType The request has succeeded.
     * @throws ApiError
     */
    public static ownerRoutesCreateBookingType({
        requestBody,
    }: {
        requestBody: CreateBookingType,
    }): CancelablePromise<BookingType> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/owner/booking-types',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * View upcoming bookings across all booking types.
     * @returns any The request has succeeded.
     * @throws ApiError
     */
    public static ownerRoutesListUpcomingBookings(): CancelablePromise<{
        items: Array<Booking>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/owner/bookings',
        });
    }
}
