import { createHash } from 'node:crypto';
import type { BookingType, TimeSlot } from './repository.js';

const WORKDAY_START_HOUR = 9;
const WORKDAY_END_HOUR = 17;
const BOOKING_WINDOW_DAYS = 14;

function slotId(bookingTypeId: string, startTime: Date): string {
  const slotKey = `${bookingTypeId}:${startTime.toISOString()}`;
  return `slot-${createHash('sha256').update(slotKey).digest('hex').slice(0, 24)}`;
}

export function listTimeSlots(
  bookingType: BookingType,
  now: Date,
  includePast = false,
): TimeSlot[] {
  const firstDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const latestAllowedStartTime =
    now.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const slots: TimeSlot[] = [];

  for (let dayOffset = 0; dayOffset <= BOOKING_WINDOW_DAYS; dayOffset += 1) {
    const day = new Date(firstDay);
    day.setUTCDate(day.getUTCDate() + dayOffset);
    const weekday = day.getUTCDay();

    if (weekday === 0 || weekday === 6) {
      continue;
    }

    const workdayStart = Date.UTC(
      day.getUTCFullYear(),
      day.getUTCMonth(),
      day.getUTCDate(),
      WORKDAY_START_HOUR,
    );
    const durationMs = bookingType.durationMinutes * 60 * 1000;

    for (
      let startTime = workdayStart;
      startTime + durationMs <=
      Date.UTC(
        day.getUTCFullYear(),
        day.getUTCMonth(),
        day.getUTCDate(),
        WORKDAY_END_HOUR,
      );
      startTime += durationMs
    ) {
      if (
        (!includePast && startTime <= now.getTime()) ||
        startTime > latestAllowedStartTime
      ) {
        continue;
      }

      const start = new Date(startTime);
      const end = new Date(startTime + durationMs);
      slots.push({
        id: slotId(bookingType.id, start),
        startTime: start,
        endTime: end,
        available: true,
      });
    }
  }

  return slots;
}
