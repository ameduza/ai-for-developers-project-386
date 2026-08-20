import { Link } from "react-router-dom";
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
            Foundation placeholder for future booking flows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Later tickets will add availability browsing and booking creation.
            This scaffold demonstrates one live request through the generated API client.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">API client demo</CardTitle>
          <CardDescription>
            Live query using the generated client and TanStack Query.
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
            <ul className="space-y-2">
              {bookingTypes.map((bookingType) => (
                <li key={bookingType.id} className="text-sm">
                  <span className="font-medium text-foreground">{bookingType.title}</span>
                  <span className="text-muted-foreground"> — {bookingType.durationMinutes} min</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
