import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Booking } from "@/lib/api/generated";
import { formatTimeSlot } from "@/lib/formatters";

interface UpcomingBookingsListProps {
  bookings: Booking[];
  isLoading: boolean;
  isError: boolean;
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
                <p className="mt-3 text-sm text-foreground">
                  {booking.guest.name}
                </p>
                <a
                  className="text-sm text-muted-foreground underline"
                  href={`mailto:${booking.guest.email}`}
                >
                  {booking.guest.email}
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
