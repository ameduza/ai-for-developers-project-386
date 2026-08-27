import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const { DefaultService, OpenAPI, ApiError, CancelablePromise, CancelError } =
  await import('../lib/api/generated/index.js');
const { configureApiClient, listGuestTimeSlots } =
  await import('../lib/api/client.js');

describe('generated API client exports', () => {
  it('exports DefaultService with expected methods', () => {
    assert.ok(DefaultService);
    assert.equal(
      typeof DefaultService.bookingTypesListBookingTypes,
      'function',
    );
    assert.equal(typeof DefaultService.bookingTypesListSlots, 'function');
    assert.equal(typeof DefaultService.bookingsCreate, 'function');
    assert.equal(typeof DefaultService.bookingsGet, 'function');
    assert.equal(typeof DefaultService.bookingsDelete, 'function');
    assert.equal(typeof DefaultService.ownerRoutesGetOwner, 'function');
    assert.equal(typeof DefaultService.ownerRoutesListBookingTypes, 'function');
    assert.equal(
      typeof DefaultService.ownerRoutesCreateBookingType,
      'function',
    );
    assert.equal(
      typeof DefaultService.ownerRoutesListUpcomingBookings,
      'function',
    );
  });

  it('lists time slots for a guest booking type', async () => {
    configureApiClient('http://localhost:3000');
    const originalFetch = globalThis.fetch;
    let requestedUrl = '';

    globalThis.fetch = async (input) => {
      requestedUrl = String(input);
      return new Response(
        JSON.stringify({
          items: [
            {
              id: 'slot-1',
              startTime: '2026-08-21T10:00:00Z',
              endTime: '2026-08-21T10:30:00Z',
              available: true,
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    };

    try {
      const result = await listGuestTimeSlots('consultation');

      assert.equal(
        requestedUrl,
        'http://localhost:3000/booking-types/consultation/slots',
      );
      assert.equal(result.items[0]?.id, 'slot-1');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('exports OpenAPI config', () => {
    assert.ok(OpenAPI);
    assert.ok('BASE' in OpenAPI);
    assert.ok('WITH_CREDENTIALS' in OpenAPI);
    assert.ok('CREDENTIALS' in OpenAPI);
  });

  it('exports error and promise utilities', () => {
    assert.ok(ApiError);
    assert.ok(CancelablePromise);
    assert.ok(CancelError);
  });
});
