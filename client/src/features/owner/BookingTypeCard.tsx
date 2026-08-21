import { Card, CardContent } from "@/components/ui/card";
import type { BookingType } from "@/lib/api/generated";

interface BookingTypeCardProps {
  bookingType: BookingType;
}

export function BookingTypeCard({ bookingType }: BookingTypeCardProps) {
  return (
    <Card className="border">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-foreground">
              {bookingType.title}
            </h4>
            <span className="rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              {bookingType.durationMinutes} min
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {bookingType.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
