import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type Express,
  type Request,
} from "express";
import { InMemoryRepository, type Fixture } from "./repository.js";
import { listTimeSlots } from "./availability.js";
import { TimeInterval } from "./time-interval.js";
import type {
  CreateBooking,
  CreateBookingType,
  Error,
  ErrorCode,
} from "./generated/api-models.js";

export interface CreateAppOptions {
  now: () => Date;
  fixture: Fixture;
}

function isCreateBookingTypeInput(body: unknown): body is CreateBookingType {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return false;
  }

  const input = body as Record<string, unknown>;
  return (
    typeof input.title === "string" &&
    typeof input.description === "string" &&
    typeof input.durationMinutes === "number" &&
    Number.isInteger(input.durationMinutes) &&
    input.title.trim().length > 0 &&
    input.description.trim().length > 0 &&
    input.durationMinutes >= 15 &&
    input.durationMinutes <= 480
  );
}

function validationError(message: string): Error {
  return protocolError("VALIDATION_FAILED", message);
}

function protocolError(code: ErrorCode, message: string): Error {
  return { code, message };
}

function isCreateBookingInput(body: unknown): body is CreateBooking {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return false;
  }

  const input = body as Record<string, unknown>;
  if (
    typeof input.bookingTypeId !== "string" ||
    typeof input.timeSlotStart !== "string" ||
    typeof input.timeSlotEnd !== "string" ||
    typeof input.guestName !== "string" ||
    typeof input.guestEmail !== "string" ||
    input.guestName.trim().length === 0 ||
    !isValidEmail(input.guestEmail)
  ) {
    return false;
  }

  function isValidEmail(email: string): boolean {
    const [localPart, domain] = email.split("@");
    if (
      !localPart ||
      !domain ||
      email.split("@").length !== 2 ||
      localPart.startsWith(".") ||
      localPart.endsWith(".") ||
      localPart.includes("..")
    ) {
      return false;
    }

    const labels = domain.split(".");
    return (
      labels.length >= 2 &&
      labels.every((label) =>
        /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label),
      )
    );
  }

  try {
    new TimeInterval(input.timeSlotStart, input.timeSlotEnd);
    return true;
  } catch {
    return false;
  }
}

export function createApp({ now, fixture }: CreateAppOptions): Express {
  const repository = new InMemoryRepository(fixture);

  const app = express();
  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json());

  app.get("/owner", (_request, response) => {
    response.json(repository.getOwner());
  });

  app.get("/booking-types", (_request, response) => {
    response.json({ items: repository.listBookingTypes() });
  });

  app.get("/booking-types/:id/slots", (request: Request, response) => {
    const bookingTypeId = request.params.id;
    const bookingType =
      typeof bookingTypeId === "string"
        ? repository.getBookingType(bookingTypeId)
        : undefined;

    if (!bookingType) {
      response
        .status(404)
        .json(
          protocolError("BOOKING_TYPE_NOT_FOUND", "Booking type not found"),
        );
      return;
    }

    const bookings = repository.listBookings();
    response.json({
      items: listTimeSlots(bookingType, now()).map((slot) => ({
        ...slot,
        available: !bookings.some((booking) =>
          new TimeInterval(slot.startTime, slot.endTime).intersects(
            new TimeInterval(
              booking.timeSlot.startTime,
              booking.timeSlot.endTime,
            ),
          ),
        ),
      })),
    });
  });

  app.get("/owner/booking-types", (_request, response) => {
    response.json({ items: repository.listBookingTypes() });
  });

  app.post("/owner/booking-types", (request: Request, response) => {
    if (!isCreateBookingTypeInput(request.body)) {
      response.status(400).json(validationError("Invalid booking type"));
      return;
    }

    response.status(201).json(repository.createBookingType(request.body));
  });

  app.get("/owner/bookings", (_request, response) => {
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

  app.post("/bookings", (request: Request, response) => {
    if (!isCreateBookingInput(request.body)) {
      response.status(400).json(validationError("Invalid booking"));
      return;
    }

    const input = request.body;
    const bookingType = repository.getBookingType(input.bookingTypeId);
    if (!bookingType) {
      response
        .status(404)
        .json(
          protocolError("BOOKING_TYPE_NOT_FOUND", "Booking type not found"),
        );
      return;
    }

    const currentTime = now();
    const gridSlot = listTimeSlots(bookingType, currentTime, true).find(
      (slot) =>
        slot.startTime === input.timeSlotStart &&
        slot.endTime === input.timeSlotEnd,
    );
    if (!gridSlot) {
      response
        .status(400)
        .json(
          protocolError(
            "SLOT_NOT_ON_GRID",
            "Time slot is not on the booking grid",
          ),
        );
      return;
    }

    if (new Date(input.timeSlotStart).getTime() <= currentTime.getTime()) {
      response
        .status(400)
        .json(protocolError("SLOT_IN_PAST", "Time slot is in the past"));
      return;
    }

    const hasConflict = repository
      .listBookings()
      .some((booking) =>
        new TimeInterval(input.timeSlotStart, input.timeSlotEnd).intersects(
          new TimeInterval(
            booking.timeSlot.startTime,
            booking.timeSlot.endTime,
          ),
        ),
      );
    if (hasConflict) {
      response
        .status(409)
        .json(
          protocolError("SLOT_NOT_AVAILABLE", "Time slot is not available"),
        );
      return;
    }

    response.status(201).json(
      repository.createBooking({
        bookingType,
        timeSlot: { ...gridSlot, available: false },
        guest: { name: input.guestName.trim(), email: input.guestEmail },
      }),
    );
  });

  app.get("/bookings/:id", (request: Request, response) => {
    const bookingId = request.params.id;
    const booking =
      typeof bookingId === "string"
        ? repository.getBooking(bookingId)
        : undefined;

    if (!booking) {
      response
        .status(404)
        .json(protocolError("BOOKING_NOT_FOUND", "Booking not found"));
      return;
    }

    response.json(booking);
  });

  app.delete("/bookings/:id", (request: Request, response) => {
    const bookingId = request.params.id;
    const deleted =
      typeof bookingId === "string"
        ? repository.deleteBooking(bookingId)
        : false;

    if (!deleted) {
      response
        .status(404)
        .json(protocolError("BOOKING_NOT_FOUND", "Booking not found"));
      return;
    }

    response.status(204).send();
  });

  const jsonErrorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    next,
  ) => {
    if (error instanceof SyntaxError && "body" in error) {
      response.status(400).json(validationError("Invalid JSON body"));
      return;
    }
    next(error);
  };
  app.use(jsonErrorHandler);

  return app;
}
