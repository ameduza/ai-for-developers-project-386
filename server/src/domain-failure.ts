import type { Error, ErrorCode } from "./generated/api-models.js";

type DomainFailureCode = Extract<
  ErrorCode,
  | "BOOKING_TYPE_NOT_FOUND"
  | "BOOKING_NOT_FOUND"
  | "SLOT_NOT_AVAILABLE"
  | "SLOT_IN_PAST"
  | "SLOT_NOT_ON_GRID"
>;

const failureResponses: Record<
  DomainFailureCode,
  { status: number; message: string }
> = {
  BOOKING_TYPE_NOT_FOUND: { status: 404, message: "Booking type not found" },
  BOOKING_NOT_FOUND: { status: 404, message: "Booking not found" },
  SLOT_NOT_AVAILABLE: { status: 409, message: "Time slot is not available" },
  SLOT_IN_PAST: { status: 400, message: "Time slot is in the past" },
  SLOT_NOT_ON_GRID: {
    status: 400,
    message: "Time slot is not on the booking grid",
  },
};

export class DomainFailure extends Error {
  constructor(readonly code: DomainFailureCode) {
    super(code);
  }
}

export function domainFailureResponse(failure: DomainFailure): {
  status: number;
  body: Error;
} {
  const response = failureResponses[failure.code];
  return {
    status: response.status,
    body: { code: failure.code, message: response.message },
  };
}
