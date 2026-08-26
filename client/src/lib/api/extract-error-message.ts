import { ApiError } from './generated';

export function extractApiErrorMessage(error: ApiError): string {
  const body = error.body;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (
    body &&
    typeof body === 'object' &&
    typeof (body as { message?: unknown }).message === 'string' &&
    (body as { message: string }).message.trim()
  ) {
    return (body as { message: string }).message;
  }

  return 'Could not create the booking. Please try again.';
}
