import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function GuestBookingTypePage() {
  const { bookingTypeId } = useParams();

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Booking type</CardTitle>
        <CardDescription>Slot browsing will land here later.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selected booking type id: <span className="font-medium text-foreground">{bookingTypeId}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          This placeholder route is wired so the later slot calendar can drop in without
          changing the URL shape.
        </p>
        <Button asChild variant="outline">
          <Link to="/guest">Back to guest area</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
