import { z } from 'zod';
import { listTimeSlots } from './availability.js';
import { DomainFailure, domainFailureResponse } from './domain-failure.js';
import { OwnerCalendar } from './owner-calendar.js';
import type { Seed } from './repository.js';
import { InMemoryRepository } from './repository.js';
import {
  ErrorCode,
  type CreateBooking,
  type CreateBookingType,
} from './generated/typespec/src/generated/models/all/index.js';
import type {
  Bookings,
  BookingTypes,
  OwnerRoutes,
} from './generated/typespec/src/generated/models/all/booking-service.js';

const createBookingTypeSchema = z
  .object({
    title: z.string().refine((value) => value.trim().length > 0),
    description: z.string().refine((value) => value.trim().length > 0),
    durationMinutes: z.number().int().min(15).max(480),
  })
  .passthrough();

const createBookingSchema = z
  .object({
    bookingTypeId: z.string(),
    timeSlotStart: z.date(),
    timeSlotEnd: z.date(),
    guestName: z.string().refine((value) => value.trim().length > 0),
    guestEmail: z.email(),
  })
  .passthrough()
  .superRefine((input, context) => {
    if (input.timeSlotStart.getTime() >= input.timeSlotEnd.getTime()) {
      context.addIssue({
        code: 'custom',
        path: ['timeSlotEnd'],
        message: 'Time slot end must be after its start',
      });
    }
  });

function validationError(message: string) {
  return { code: ErrorCode.Validation_Failed, message };
}

export function createOperations({
  now,
  seed,
}: {
  now: () => Date;
  seed: Seed;
}) {
  const repository = new InMemoryRepository(seed);
  const ownerRoutes: OwnerRoutes = {
    async getOwner() {
      return repository.getOwner();
    },
    async listBookingTypes() {
      return { items: repository.listBookingTypes() };
    },
    async createBookingType(_context, bookingType: CreateBookingType) {
      const validation = createBookingTypeSchema.safeParse(bookingType);
      if (!validation.success) {
        return {
          statusCode: 400,
          body: domainFailureResponse(
            new DomainFailure(ErrorCode.Validation_Failed),
          ).body,
        };
      }
      return {
        statusCode: 201,
        body: repository.createBookingType(validation.data),
      };
    },
    async listUpcomingBookings() {
      const currentTime = now().getTime();
      return {
        items: repository
          .listBookings()
          .filter(
            (booking) => booking.timeSlot.startTime.getTime() > currentTime,
          )
          .sort(
            (first, second) =>
              first.timeSlot.startTime.getTime() -
              second.timeSlot.startTime.getTime(),
          ),
      };
    },
  };
  const bookingTypes: BookingTypes = {
    async listBookingTypes() {
      return { items: repository.listBookingTypes() };
    },
    async listSlots(_context, bookingTypeId) {
      const bookingType = repository.getBookingType(bookingTypeId);
      if (!bookingType) {
        return {
          statusCode: 404,
          body: domainFailureResponse(
            new DomainFailure(ErrorCode.Booking_TypeNotFound),
          ).body,
        };
      }
      const ownerCalendar = new OwnerCalendar(repository.listBookings());
      return {
        statusCode: 200,
        body: {
          items: listTimeSlots(bookingType, now()).map((slot) => ({
            ...slot,
            available: !ownerCalendar.hasConflict(slot),
          })),
        },
      };
    },
  };
  const bookings: Bookings = {
    async create(_context, booking: CreateBooking) {
      const validation = createBookingSchema.safeParse(booking);
      if (!validation.success)
        return { statusCode: 400, body: validationError('Invalid booking') };
      const input = validation.data;
      const bookingType = repository.getBookingType(input.bookingTypeId);
      if (!bookingType)
        return domainFailureResponse(
          new DomainFailure(ErrorCode.Booking_TypeNotFound),
        );
      const currentTime = now();
      const gridSlot = listTimeSlots(bookingType, currentTime, true).find(
        (slot) =>
          slot.startTime.getTime() === input.timeSlotStart.getTime() &&
          slot.endTime.getTime() === input.timeSlotEnd.getTime(),
      );
      if (!gridSlot)
        return domainFailureResponse(
          new DomainFailure(ErrorCode.Slot_NotOnGrid),
        );
      if (gridSlot.startTime.getTime() <= currentTime.getTime())
        return domainFailureResponse(new DomainFailure(ErrorCode.Slot_InPast));
      const ownerCalendar = new OwnerCalendar(repository.listBookings());
      if (ownerCalendar.hasConflict(gridSlot))
        return domainFailureResponse(
          new DomainFailure(ErrorCode.Slot_NotAvailable),
        );
      return {
        statusCode: 201,
        body: repository.createBooking({
          bookingType,
          timeSlot: { ...gridSlot, available: false },
          guest: { name: input.guestName.trim(), email: input.guestEmail },
        }),
      };
    },
    async get(_context, bookingId) {
      const booking = repository.getBooking(bookingId);
      return booking
        ? { statusCode: 200, body: booking }
        : {
            statusCode: 404,
            body: domainFailureResponse(
              new DomainFailure(ErrorCode.Booking_NotFound),
            ).body,
          };
    },
    async delete(_context, bookingId) {
      return repository.deleteBooking(bookingId)
        ? { statusCode: 204 }
        : {
            statusCode: 404,
            body: domainFailureResponse(
              new DomainFailure(ErrorCode.Booking_NotFound),
            ).body,
          };
    },
  };
  return { ownerRoutes, bookingTypes, bookings };
}
