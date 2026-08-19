import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function GuestBookingConfirmationPage() {
  const { bookingId } = useParams();

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Booking confirmation</CardTitle>
        <CardDescription>
          Durable confirmation route for later guest revisit and cancel actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Booking id: <span className="font-medium text-foreground">{bookingId}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          The real API-backed confirmation view will mount here in the next ticket.
        </p>
        <Button asChild variant="outline">
          <Link to="/guest">Back to guest area</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
