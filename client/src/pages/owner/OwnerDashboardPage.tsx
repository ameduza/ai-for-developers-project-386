import { Link } from "react-router-dom";
import { CalendarDays, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOwnerBookingsQuery, useOwnerProfileQuery } from "@/features/owner/queries";

export function OwnerDashboardPage() {
  const ownerProfileQuery = useOwnerProfileQuery();
  const ownerBookingsQuery = useOwnerBookingsQuery();
  const upcomingBookings = ownerBookingsQuery.data?.items ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Owner area</CardTitle>
          <CardDescription>Ungated owner route shell.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ownerProfileQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading owner profile...</p>
          ) : ownerProfileQuery.isError ? (
            <p className="text-sm text-destructive">Could not load owner profile.</p>
          ) : ownerProfileQuery.data ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-base font-medium">
                <UserRound className="h-4 w-4 text-primary" />
                {ownerProfileQuery.data.name}
              </div>
              <p className="text-sm text-muted-foreground">{ownerProfileQuery.data.bio}</p>
            </div>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming bookings</CardTitle>
          <CardDescription>Combined schedule view backed by the generated client.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ownerBookingsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading upcoming bookings...</p>
          ) : ownerBookingsQuery.isError ? (
            <p className="text-sm text-destructive">Could not load upcoming bookings.</p>
          ) : upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming bookings yet.</p>
          ) : (
            upcomingBookings.map((booking) => (
              <div key={booking.id} className="rounded-md border p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {booking.bookingType.title}
                </div>
                <p className="text-sm text-muted-foreground">
                  {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
                </p>
                <p className="text-sm text-muted-foreground">{booking.guest.name}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
