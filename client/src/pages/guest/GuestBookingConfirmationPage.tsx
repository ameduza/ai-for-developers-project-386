import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiError } from '@/lib/api/generated';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useBookingQuery,
  useCancelBookingMutation,
} from '@/features/guest/queries';
import { formatTimeSlot } from '@/features/guest/format-time-slot';

function StateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className='max-w-3xl'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant='outline'>
          <Link to='/guest'>Back to guest area</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function GuestBookingConfirmationPage() {
  const { bookingId } = useParams();
  const bookingQuery = useBookingQuery(bookingId);
  const cancelMutation = useCancelBookingMutation();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (cancelMutation.isSuccess) {
    return (
      <StateCard
        title='Booking cancelled'
        description='This booking has been cancelled. The time slot is free again.'
      />
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <Card className='max-w-3xl'>
        <CardHeader>
          <CardTitle>Booking confirmation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>Loading booking...</p>
        </CardContent>
      </Card>
    );
  }

  if (bookingQuery.isError || !bookingQuery.data) {
    const isNotFound =
      bookingQuery.error instanceof ApiError &&
      bookingQuery.error.status === 404;

    return isNotFound ? (
      <StateCard
        title='Booking not found'
        description='This booking does not exist or may have been cancelled.'
      />
    ) : (
      <StateCard
        title='Could not load booking'
        description='Something went wrong while loading this booking.'
      />
    );
  }

  const booking = bookingQuery.data;

  return (
    <Card className='max-w-3xl'>
      <CardHeader>
        <CardTitle>{booking.bookingType.title}</CardTitle>
        <CardDescription>{booking.bookingType.description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='text-sm text-muted-foreground'>
          Your time slot:{' '}
          <time
            className='font-medium text-foreground'
            dateTime={booking.timeSlot.startTime}
          >
            {formatTimeSlot(booking.timeSlot)}
          </time>
        </p>
        <p className='text-sm text-muted-foreground'>
          Booked by{' '}
          <span className='font-medium text-foreground'>
            {booking.guest.name}
          </span>{' '}
          ({booking.guest.email})
        </p>

        {cancelMutation.isError && (
          <p role='alert' className='text-sm text-destructive'>
            Could not cancel the booking. Please try again.
          </p>
        )}

        {confirmingCancel ? (
          <div className='space-y-2'>
            <p className='text-sm text-muted-foreground'>
              Cancel this booking? This cannot be undone.
            </p>
            <div className='flex gap-2'>
              <Button
                variant='destructive'
                onClick={() => cancelMutation.mutate(booking.id)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Yes, cancel it'}
              </Button>
              <Button
                variant='outline'
                onClick={() => setConfirmingCancel(false)}
                disabled={cancelMutation.isPending}
              >
                Keep booking
              </Button>
            </div>
          </div>
        ) : (
          <div className='flex gap-2'>
            <Button
              variant='destructive'
              onClick={() => setConfirmingCancel(true)}
            >
              Cancel booking
            </Button>
            <Button asChild variant='outline'>
              <Link to='/guest'>Back to guest area</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
