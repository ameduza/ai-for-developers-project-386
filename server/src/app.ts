import cors from 'cors';
import express, { type Express } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { PassThrough } from 'node:stream';
import { z } from 'zod';
import { createBookingServiceRouter } from './generated/typespec/src/generated/http/router.js';
import type { BookingServiceRouter } from './generated/typespec/src/generated/http/router.js';
import { ErrorCode } from './generated/typespec/src/generated/models/all/index.js';
import { createOperations } from './operations.js';
import type { Seed } from './repository.js';

export interface CreateAppOptions {
  now: () => Date;
  seed: Seed;
}

function errorBody(code: ErrorCode, message: string) {
  return JSON.stringify({ code, message });
}

function sendJsonError(
  response: ServerResponse,
  status: number,
  code: ErrorCode,
  message: string,
): void {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json');
  response.end(errorBody(code, message));
}

const bookingRequestSchema = z
  .object({
    timeSlotStart: z.iso.datetime({ offset: true }),
    timeSlotEnd: z.iso.datetime({ offset: true }),
  })
  .passthrough();

function dispatchWithBookingRequestValidation(
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
  router: BookingServiceRouter,
): void {
  if (
    request.method !== 'POST' ||
    new URL(request.url ?? '/', 'http://localhost').pathname !== '/bookings'
  ) {
    router.expressMiddleware(request, response, next);
    return;
  }
  const chunks: Buffer[] = [];
  request.on('data', (chunk: Buffer) => chunks.push(chunk));
  request.on('error', next);
  request.on('end', () => {
    const body = Buffer.concat(chunks);
    try {
      if (
        !bookingRequestSchema.safeParse(JSON.parse(body.toString())).success
      ) {
        sendJsonError(
          response,
          400,
          ErrorCode.Validation_Failed,
          'Invalid booking',
        );
        return;
      }
    } catch {
      // The generated operation emits the stable malformed-JSON response.
    }
    const replay = Object.assign(new PassThrough(), {
      headers: request.headers,
      method: request.method,
      url: request.url,
    });
    replay.end(body);
    router.expressMiddleware(
      replay as unknown as IncomingMessage,
      response,
      next,
    );
  });
}

export function createApp({ now, seed }: CreateAppOptions): Express {
  const app = express();
  const { ownerRoutes, bookingTypes, bookings } = createOperations({
    now,
    seed,
  });
  const router = createBookingServiceRouter(
    ownerRoutes,
    bookingTypes,
    bookings,
    {
      onInvalidRequest(context, route, error) {
        sendJsonError(
          context.response,
          400,
          ErrorCode.Validation_Failed,
          error === 'invalid JSON in request body'
            ? 'Invalid JSON body'
            : route === '/owner/booking-types'
              ? 'Invalid booking type'
              : route === '/bookings'
                ? 'Invalid booking'
                : 'Invalid JSON body',
        );
      },
      onInternalError(context, error) {
        if (context.response.headersSent) return;
        console.error(error);
        sendJsonError(
          context.response,
          500,
          ErrorCode.Internal_Error,
          'Internal server error',
        );
      },
    },
  );
  app.use(cors({ origin: 'http://localhost:5173' }));
  app.use((request, response, next) =>
    dispatchWithBookingRequestValidation(request, response, next, router),
  );
  return app;
}
