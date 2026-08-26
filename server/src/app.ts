import cors from 'cors';
import express, {
  type ErrorRequestHandler,
  type Express,
  type Request,
} from 'express';
import { z } from 'zod';
import { InMemoryRepository, type Seed } from './repository.js';
import { listTimeSlots } from './availability.js';
import { DomainFailure, domainFailureResponse } from './domain-failure.js';
import { OwnerCalendar } from './owner-calendar.js';
import type { Error, ErrorCode } from './generated/api-models.js';

export interface CreateAppOptions {
  now: () => Date;
  seed: Seed;
}

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
    timeSlotStart: z.iso.datetime({ offset: true }),
    timeSlotEnd: z.iso.datetime({ offset: true }),
    guestName: z.string().refine((value) => value.trim().length > 0),
    guestEmail: z.email(),
  })
  .passthrough()
  .superRefine((input, context) => {
    if (
      new Date(input.timeSlotStart).getTime() >=
      new Date(input.timeSlotEnd).getTime()
    ) {
      context.addIssue({
        code: 'custom',
        path: ['timeSlotEnd'],
        message: 'Time slot end must be after its start',
      });
    }
  });

function validationError(message: string): Error {
  return protocolError('VALIDATION_FAILED', message);
}

function protocolError(code: ErrorCode, message: string): Error {
  return { code, message };
}

export function createApp({ now, seed }: CreateAppOptions): Express {
  const repository = new InMemoryRepository(seed);

  const app = express();
  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use(express.json());

  app.get('/owner', (_request, response) => {
    response.json(repository.getOwner());
  });

  app.get('/booking-types', (_request, response) => {
    response.json({ items: repository.listBookingTypes() });
  });

  app.get('/booking-types/:id/slots', (request: Request, response) => {
    const bookingTypeId = request.params.id;
    const bookingType =
      typeof bookingTypeId === 'string'
        ? repository.getBookingType(bookingTypeId)
        : undefined;

    if (!bookingType) {
      throw new DomainFailure('BOOKING_TYPE_NOT_FOUND');
    }

    const ownerCalendar = new OwnerCalendar(repository.listBookings());
    response.json({
      items: listTimeSlots(bookingType, now()).map((slot) => ({
        ...slot,
        available: !ownerCalendar.hasConflict(slot),
      })),
    });
  });

  app.get('/owner/booking-types', (_request, response) => {
    response.json({ items: repository.listBookingTypes() });
  });

  app.post('/owner/booking-types', (request: Request, response) => {
    const validation = createBookingTypeSchema.safeParse(request.body);
    if (!validation.success) {
      response.status(400).json(validationError('Invalid booking type'));
      return;
    }

    response.status(201).json(repository.createBookingType(validation.data));
  });

  app.get('/owner/bookings', (_request, response) => {
    const currentTime = now().getTime();
    const upcomingBookings = repository
      .listBookings()
      .filter(
        (booking) =>
          new Date(booking.timeSlot.startTime).getTime() > currentTime,
      )
      .sort(
        (first, second) =>
          new Date(first.timeSlot.startTime).getTime() -
          new Date(second.timeSlot.startTime).getTime(),
      );

    response.json({ items: upcomingBookings });
  });

  app.post('/bookings', (request: Request, response) => {
    const validation = createBookingSchema.safeParse(request.body);
    if (!validation.success) {
      response.status(400).json(validationError('Invalid booking'));
      return;
    }

    const input = validation.data;
    const bookingType = repository.getBookingType(input.bookingTypeId);
    if (!bookingType) {
      throw new DomainFailure('BOOKING_TYPE_NOT_FOUND');
    }

    const currentTime = now();
    const requestedStartTime = new Date(input.timeSlotStart).getTime();
    const requestedEndTime = new Date(input.timeSlotEnd).getTime();
    const gridSlot = listTimeSlots(bookingType, currentTime, true).find(
      (slot) =>
        new Date(slot.startTime).getTime() === requestedStartTime &&
        new Date(slot.endTime).getTime() === requestedEndTime,
    );
    if (!gridSlot) {
      throw new DomainFailure('SLOT_NOT_ON_GRID');
    }

    if (new Date(gridSlot.startTime).getTime() <= currentTime.getTime()) {
      throw new DomainFailure('SLOT_IN_PAST');
    }

    const ownerCalendar = new OwnerCalendar(repository.listBookings());
    if (ownerCalendar.hasConflict(gridSlot)) {
      throw new DomainFailure('SLOT_NOT_AVAILABLE');
    }

    response.status(201).json(
      repository.createBooking({
        bookingType,
        timeSlot: { ...gridSlot, available: false },
        guest: { name: input.guestName.trim(), email: input.guestEmail },
      }),
    );
  });

  app.get('/bookings/:id', (request: Request, response) => {
    const bookingId = request.params.id;
    const booking =
      typeof bookingId === 'string'
        ? repository.getBooking(bookingId)
        : undefined;

    if (!booking) {
      throw new DomainFailure('BOOKING_NOT_FOUND');
    }

    response.json(booking);
  });

  app.delete('/bookings/:id', (request: Request, response) => {
    const bookingId = request.params.id;
    const deleted =
      typeof bookingId === 'string'
        ? repository.deleteBooking(bookingId)
        : false;

    if (!deleted) {
      throw new DomainFailure('BOOKING_NOT_FOUND');
    }

    response.status(204).send();
  });

  const errorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    next,
  ) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    if (error instanceof SyntaxError && 'body' in error) {
      response.status(400).json(validationError('Invalid JSON body'));
      return;
    }
    if (error instanceof DomainFailure) {
      const { status, body } = domainFailureResponse(error);
      response.status(status).json(body);
      return;
    }
    console.error(error);
    response
      .status(500)
      .json(protocolError('INTERNAL_ERROR', 'Internal server error'));
  };
  app.use(errorHandler);

  return app;
}
