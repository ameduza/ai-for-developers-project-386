import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TimeSlot } from "@/lib/api/generated";
import { useGuestTimeSlotsQuery } from "@/features/guest/queries";

const BOOKING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

function isWithinBookingWindow(timeSlot: TimeSlot, now: number) {
  const startTime = new Date(timeSlot.startTime).getTime();

  return (
    Number.isFinite(startTime) &&
    startTime >= now &&
    startTime <= now + BOOKING_WINDOW_MS
  );
}

function formatTimeSlot(timeSlot: TimeSlot) {
  const start = new Date(timeSlot.startTime);
  const end = new Date(timeSlot.endTime);

  return `${dateFormatter.format(start)} · ${timeFormatter.format(start)}–${timeFormatter.format(end)} UTC`;
}

export function GuestBookingTypePage() {
  const { bookingTypeId } = useParams();
  const slotsQuery = useGuestTimeSlotsQuery(bookingTypeId);
  const now = Date.now();
  const availableSlots = (slotsQuery.data?.items ?? [])
    .filter((timeSlot) => timeSlot.available && isWithinBookingWindow(timeSlot, now))
    .sort((first, second) => first.startTime.localeCompare(second.startTime));

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Available time slots</CardTitle>
        <CardDescription>
          Choose a free time slot for booking type {bookingTypeId}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {slotsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading available time slots...</p>
        ) : slotsQuery.isError ? (
          <p className="text-sm text-destructive">
            Could not load available time slots. Is the mock server running?
          </p>
        ) : availableSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No free time slots are available in the next 14 days.
          </p>
        ) : (
          <ol aria-label="Available time slots" className="space-y-3">
            {availableSlots.map((timeSlot) => (
              <li key={timeSlot.id} className="rounded-lg border p-4">
                <time
                  className="text-sm font-medium text-foreground"
                  dateTime={timeSlot.startTime}
                >
                  {formatTimeSlot(timeSlot)}
                </time>
              </li>
            ))}
          </ol>
        )}
        <Button asChild variant="outline">
          <Link to="/guest">Back to guest area</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
