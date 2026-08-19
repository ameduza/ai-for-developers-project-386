import { Link } from "react-router-dom";
import { Sparkles, Ticket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGuestBookingTypesQuery } from "@/features/guest/queries";

export function GuestLandingPage() {
  const bookingTypesQuery = useGuestBookingTypesQuery();
  const bookingTypes = bookingTypesQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Guest area</CardTitle>
          <CardDescription>
            The first live request is wired here through the generated API client.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Later tickets will add slot browsing and booking; this scaffold already reads
            the contract-backed booking types.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Booking types
        </div>

        {bookingTypesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading booking types...</p>
        ) : bookingTypesQuery.isError ? (
          <p className="text-sm text-destructive">
            Could not load booking types.
          </p>
        ) : bookingTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No booking types are published yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bookingTypes.map((bookingType) => (
              <Card key={bookingType.id} className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Ticket className="h-4 w-4 text-primary" />
                    {bookingType.title}
                  </CardTitle>
                  <CardDescription>{bookingType.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                  <span>{bookingType.durationMinutes} minutes</span>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/guest/booking-types/${bookingType.id}`}>View slots</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
