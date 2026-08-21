import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Booking, TimeSlot } from "@/lib/api/generated";

interface UpcomingBookingsListProps {
  bookings: Booking[];
  isLoading: boolean;
  isError: boolean;
}

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

function formatTimeSlot(timeSlot: TimeSlot) {
  const start = new Date(timeSlot.startTime);
  const end = new Date(timeSlot.endTime);

  return `${dateFormatter.format(start)} · ${timeFormatter.format(start)}–${timeFormatter.format(end)} UTC`;
}

export function UpcomingBookingsList({
  bookings,
  isLoading,
  isError,
}: UpcomingBookingsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Bookings</CardTitle>
        <CardDescription>
          All confirmed bookings across your published booking types.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading upcoming bookings...
          </p>
        ) : isError ? (
          <p className="text-sm text-destructive">
            Could not load upcoming bookings. Is the mock server running?
          </p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming bookings yet.
          </p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-lg border p-4">
                <h4 className="font-semibold text-foreground">
                  {booking.bookingType.title}
                </h4>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Time Slot
                </p>
                <time
                  className="text-sm text-foreground"
                  dateTime={booking.timeSlot.startTime}
                >
                  {formatTimeSlot(booking.timeSlot)}
                </time>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
