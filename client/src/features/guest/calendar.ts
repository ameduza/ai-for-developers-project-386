import type { TimeSlot } from '@/lib/api/generated';

const BOOKING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function isWithinBookingWindow(timeSlot: TimeSlot, now: number) {
  const startTime = new Date(timeSlot.startTime).getTime();

  return (
    Number.isFinite(startTime) &&
    startTime >= now &&
    startTime <= now + BOOKING_WINDOW_MS
  );
}

export function utcDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

export function utcMonthKey(value: string) {
  return value.slice(0, 7);
}

function dateFromKey(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

export function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateFromKey(value));
}

export function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateFromKey(`${value}-01`));
}

export function shiftMonth(value: string, delta: number) {
  const date = dateFromKey(`${value}-01`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return utcDateKey(date).slice(0, 7);
}

export function monthCells(month: string) {
  const first = dateFromKey(`${month}-01`);
  const year = first.getUTCFullYear();
  const monthIndex = first.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  return [
    ...Array.from<null>({ length: first.getUTCDay() }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      utcDateKey(new Date(Date.UTC(year, monthIndex, index + 1))),
    ),
  ];
}
