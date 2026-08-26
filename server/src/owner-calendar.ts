import type { Booking, TimeSlot } from "./generated/api-models.js";
import { TimeInterval } from "./time-interval.js";

/** The Owner's Calendar is occupied by every Booking, regardless of its type. */
export class OwnerCalendar {
  private readonly occupiedIntervals: TimeInterval[];

  constructor(bookings: ReadonlyArray<Booking>) {
    this.occupiedIntervals = bookings.map(
      (booking) =>
        new TimeInterval(booking.timeSlot.startTime, booking.timeSlot.endTime),
    );
  }

  hasConflict(timeSlot: TimeSlot): boolean {
    const candidateInterval = new TimeInterval(
      timeSlot.startTime,
      timeSlot.endTime,
    );
    return this.occupiedIntervals.some((interval) =>
      candidateInterval.intersects(interval),
    );
  }
}
