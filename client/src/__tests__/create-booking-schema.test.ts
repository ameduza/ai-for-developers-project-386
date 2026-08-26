import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createBookingSchema } from '@/features/guest/schemas';

const validBooking = {
  bookingTypeId: 'consultation',
  slotStart: '2026-10-15T10:00:00Z',
  slotEnd: '2026-10-15T10:30:00Z',
  guestName: 'Ada Lovelace',
  guestEmail: 'ada@example.com',
};

describe('createBooking Schema Validation', () => {
  it('validates a valid booking aligned to the contract request shape', () => {
    const result = createBookingSchema.safeParse(validBooking);
    assert.ok(result.success, 'Valid booking should pass validation');
  });

  it('rejects a missing guest name', () => {
    const invalidData = { ...validBooking, guestName: '' };
    const result = createBookingSchema.safeParse(invalidData);
    assert.equal(
      result.success,
      false,
      'Empty guest name should fail validation',
    );
  });

  it('rejects a missing guest email', () => {
    const invalidData = { ...validBooking, guestEmail: '' };
    const result = createBookingSchema.safeParse(invalidData);
    assert.equal(
      result.success,
      false,
      'Empty guest email should fail validation',
    );
  });

  it('rejects an invalid guest email format', () => {
    const invalidData = { ...validBooking, guestEmail: 'not-an-email' };
    const result = createBookingSchema.safeParse(invalidData);
    assert.equal(
      result.success,
      false,
      'Invalid email format should fail validation',
    );
  });

  it('rejects a missing booking type id', () => {
    const invalidData = { ...validBooking, bookingTypeId: '' };
    const result = createBookingSchema.safeParse(invalidData);
    assert.equal(
      result.success,
      false,
      'Missing booking type id should fail validation',
    );
  });

  it('rejects missing time slot boundaries', () => {
    const missingStart = createBookingSchema.safeParse({
      ...validBooking,
      slotStart: '',
    });
    assert.equal(
      missingStart.success,
      false,
      'Missing time slot start should fail validation',
    );

    const missingEnd = createBookingSchema.safeParse({
      ...validBooking,
      slotEnd: '',
    });
    assert.equal(
      missingEnd.success,
      false,
      'Missing time slot end should fail validation',
    );
  });
});
