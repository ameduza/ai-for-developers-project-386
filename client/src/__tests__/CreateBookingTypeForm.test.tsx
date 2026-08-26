import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createBookingTypeSchema } from '@/features/owner/schemas';

describe('CreateBookingType Schema Validation', () => {
  it('validates a valid booking type', () => {
    const validData = {
      title: 'Strategy Session',
      description: 'A 30-minute deep dive into your business strategy',
      durationMinutes: 30,
    };

    const result = createBookingTypeSchema.safeParse(validData);
    assert.ok(result.success, 'Valid booking type should pass validation');
  });

  it('rejects missing title', () => {
    const invalidData = {
      description: 'A 30-minute deep dive into your business strategy',
      durationMinutes: 30,
    };

    const result = createBookingTypeSchema.safeParse(invalidData);
    assert.equal(result.success, false, 'Missing title should fail validation');
  });

  it('rejects title shorter than 3 characters', () => {
    const invalidData = {
      title: 'ab',
      description: 'A 30-minute deep dive into your business strategy',
      durationMinutes: 30,
    };

    const result = createBookingTypeSchema.safeParse(invalidData);
    assert.equal(
      result.success,
      false,
      'Title shorter than 3 chars should fail',
    );
  });

  it('rejects description shorter than 10 characters', () => {
    const invalidData = {
      title: 'Strategy Session',
      description: 'short',
      durationMinutes: 30,
    };

    const result = createBookingTypeSchema.safeParse(invalidData);
    assert.equal(
      result.success,
      false,
      'Description shorter than 10 chars should fail',
    );
  });

  it('rejects duration less than 15 minutes', () => {
    const invalidData = {
      title: 'Strategy Session',
      description: 'A 30-minute deep dive into your business strategy',
      durationMinutes: 10,
    };

    const result = createBookingTypeSchema.safeParse(invalidData);
    assert.equal(
      result.success,
      false,
      'Duration less than 15 minutes should fail',
    );
  });

  it('rejects duration greater than 480 minutes', () => {
    const invalidData = {
      title: 'Strategy Session',
      description: 'A 30-minute deep dive into your business strategy',
      durationMinutes: 500,
    };

    const result = createBookingTypeSchema.safeParse(invalidData);
    assert.equal(
      result.success,
      false,
      'Duration greater than 480 minutes should fail',
    );
  });

  it('accepts edge case duration values', () => {
    const validData = {
      title: 'Strategy Session',
      description: 'A 30-minute deep dive into your business strategy',
      durationMinutes: 15, // minimum
    };

    const result = createBookingTypeSchema.safeParse(validData);
    assert.ok(result.success, '15 minute duration should pass');

    const validData2 = {
      title: 'Marathon Session',
      description: 'A full day workshop for strategic planning',
      durationMinutes: 480, // maximum
    };

    const result2 = createBookingTypeSchema.safeParse(validData2);
    assert.ok(result2.success, '480 minute duration should pass');
  });
});
