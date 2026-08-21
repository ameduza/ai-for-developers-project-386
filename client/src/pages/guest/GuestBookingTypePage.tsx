import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TimeSlot } from "@/lib/api/generated";
import { useGuestTimeSlotsQuery } from "@/features/guest/queries";
import { BookingForm } from "@/features/guest/BookingForm";
import { formatTimeSlot } from "@/features/guest/format-time-slot";

const BOOKING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function isWithinBookingWindow(timeSlot: TimeSlot, now: number) {
  const startTime = new Date(timeSlot.startTime).getTime();

  return (
    Number.isFinite(startTime) &&
    startTime >= now &&
    startTime <= now + BOOKING_WINDOW_MS
  );
}

export function GuestBookingTypePage() {
  const { bookingTypeId } = useParams();
  const timeSlotsQuery = useGuestTimeSlotsQuery(bookingTypeId);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const now = Date.now();
  const availableTimeSlots = (timeSlotsQuery.data?.items ?? [])
    .filter(
      (timeSlot) => timeSlot.available && isWithinBookingWindow(timeSlot, now),
    )
    .sort((first, second) => first.startTime.localeCompare(second.startTime));
  const selectedTimeSlot =
    availableTimeSlots.find((timeSlot) => timeSlot.id === selectedSlotId) ??
    null;

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available time slots</CardTitle>
          <CardDescription>
            Choose a free time slot for booking type {bookingTypeId}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {timeSlotsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading available time slots...
            </p>
          ) : timeSlotsQuery.isError ? (
            <p className="text-sm text-destructive">
              Could not load available time slots. Is the mock server running?
            </p>
          ) : availableTimeSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No free time slots are available in the next 14 days.
            </p>
          ) : (
            <ol aria-label="Available time slots" className="space-y-3">
              {availableTimeSlots.map((timeSlot) => (
                <li key={timeSlot.id} className="rounded-lg border p-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="time-slot"
                      value={timeSlot.id}
                      checked={selectedSlotId === timeSlot.id}
                      onChange={() => setSelectedSlotId(timeSlot.id)}
                    />
                    <time
                      className="text-sm font-medium text-foreground"
                      dateTime={timeSlot.startTime}
                    >
                      {formatTimeSlot(timeSlot)}
                    </time>
                  </label>
                </li>
              ))}
            </ol>
          )}
          <Button asChild variant="outline">
            <Link to="/guest">Back to guest area</Link>
          </Button>
        </CardContent>
      </Card>
      {selectedTimeSlot && bookingTypeId && (
        <BookingForm
          key={selectedTimeSlot.id}
          bookingTypeId={bookingTypeId}
          timeSlot={selectedTimeSlot}
        />
      )}
    </div>
  );
}
