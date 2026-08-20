import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGuestBookingTypesQuery } from "@/features/guest/queries";

export function GuestLandingPage() {
  const bookingTypesQuery = useGuestBookingTypesQuery();
  const bookingTypes = bookingTypesQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Available Booking Types</CardTitle>
          <CardDescription>
            Select a time slot that works best for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookingTypesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading booking types...</p>
          ) : bookingTypesQuery.isError ? (
            <p className="text-sm text-destructive">
              Could not load booking types. Is the mock server running?
            </p>
          ) : bookingTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No booking types are published yet.</p>
          ) : (
            <div className="space-y-4">
              {bookingTypes.map((bookingType) => (
                <Card key={bookingType.id} className="border">
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-foreground">{bookingType.title}</h4>
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                          {bookingType.durationMinutes} min
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{bookingType.description}</p>
                      <Button asChild className="w-full mt-4">
                        <Link to={`/guest/booking-types/${bookingType.id}`}>Book Now</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
