import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type Express,
  type Request,
} from "express";
import {
  InMemoryRepository,
  type CreateBookingTypeInput,
  type Repository,
} from "./repository.js";

export interface CreateAppOptions {
  now: () => Date;
  seed: number;
  repository?: Repository;
}

function isCreateBookingTypeInput(
  body: unknown,
): body is CreateBookingTypeInput {
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

function validationError(message: string) {
  return { code: "VALIDATION_FAILED", message };
}

export function createApp({
  now,
  seed,
  repository = new InMemoryRepository(),
}: CreateAppOptions): Express {
  void now;
  void seed;

  const app = express();
  app.use(cors({ origin: "http://localhost:5173" }));
  app.use(express.json());

  app.get("/owner", (_request, response) => {
    response.json(repository.getOwner());
  });

  app.get("/booking-types", (_request, response) => {
    response.json({ items: repository.listBookingTypes() });
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
    response.json({ items: repository.listBookings() });
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
