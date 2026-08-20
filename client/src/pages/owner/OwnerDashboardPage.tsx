import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerProfile } from "@/features/owner/OwnerProfile";
import { BookingTypeCard } from "@/features/owner/BookingTypeCard";
import { CreateBookingTypeForm } from "@/features/owner/CreateBookingTypeForm";
import { UpcomingBookingsList } from "@/features/owner/UpcomingBookingsList";
import {
  useOwnerProfileQuery,
  useOwnerBookingTypesQuery,
  useOwnerUpcomingBookingsQuery,
} from "@/features/owner/queries";

export function OwnerDashboardPage() {
  const profileQuery = useOwnerProfileQuery();
  const bookingTypesQuery = useOwnerBookingTypesQuery();
  const upcomingBookingsQuery = useOwnerUpcomingBookingsQuery();
  const bookingTypes = bookingTypesQuery.data?.items ?? [];
  const upcomingBookings = upcomingBookingsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Owner Profile Section */}
      <OwnerProfile
        owner={profileQuery.data}
        isLoading={profileQuery.isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Published Booking Types */}
        <Card>
          <CardHeader>
            <CardTitle>Published Booking Types</CardTitle>
            <CardDescription>
              Services available for guests to book.
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
              <p className="text-sm text-muted-foreground">
                No booking types published yet. Create one to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {bookingTypes.map((bookingType) => (
                  <BookingTypeCard
                    key={bookingType.id}
                    bookingType={bookingType}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create New Booking Type Form */}
        <CreateBookingTypeForm />
      </div>

      <UpcomingBookingsList
        bookings={upcomingBookings}
        isLoading={upcomingBookingsQuery.isLoading}
        isError={upcomingBookingsQuery.isError}
      />
    </div>
  );
}
