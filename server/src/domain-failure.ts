import {
  ErrorCode,
  type Error,
} from './generated/typespec/src/generated/models/all/index.js';

type DomainFailureCode =
  | ErrorCode.Validation_Failed
  | ErrorCode.Booking_TypeNotFound
  | ErrorCode.Booking_NotFound
  | ErrorCode.Slot_NotAvailable
  | ErrorCode.Slot_InPast
  | ErrorCode.Slot_NotOnGrid;

const failureResponses: Record<
  DomainFailureCode,
  { status: number; message: string }
> = {
  [ErrorCode.Validation_Failed]: {
    status: 400,
    message: 'Invalid booking type',
  },
  [ErrorCode.Booking_TypeNotFound]: {
    status: 404,
    message: 'Booking type not found',
  },
  [ErrorCode.Booking_NotFound]: { status: 404, message: 'Booking not found' },
  [ErrorCode.Slot_NotAvailable]: {
    status: 409,
    message: 'Time slot is not available',
  },
  [ErrorCode.Slot_InPast]: { status: 400, message: 'Time slot is in the past' },
  [ErrorCode.Slot_NotOnGrid]: {
    status: 400,
    message: 'Time slot is not on the booking grid',
  },
};

export class DomainFailure extends Error {
  constructor(readonly code: DomainFailureCode) {
    super(code);
  }
}

export function domainFailureResponse(failure: DomainFailure): {
  statusCode: 400 | 404 | 409;
  body: Error;
} {
  const response = failureResponses[failure.code];
  return {
    statusCode: response.status as 400 | 404 | 409,
    body: { code: failure.code, message: response.message },
  };
}
