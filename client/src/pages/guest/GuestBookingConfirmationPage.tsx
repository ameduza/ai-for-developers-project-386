import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, CircleX } from 'lucide-react';
import { ApiError } from '@/lib/api/generated';
import {
  useBookingQuery,
  useCancelBookingMutation,
} from '@/features/guest/queries';
import { formatTimeSlot } from '@/features/guest/format-time-slot';
import { usePageTitle } from '@/lib/use-page-title';

function StateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className='guest-confirmation guest-state-panel'>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link className='guest-primary-action' to='/guest'>
        Go to booking page
      </Link>
    </section>
  );
}

export function GuestBookingConfirmationPage() {
  const { bookingId } = useParams();
  const bookingQuery = useBookingQuery(bookingId);
  const cancelMutation = useCancelBookingMutation();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const isNotFound =
    bookingQuery.error instanceof ApiError && bookingQuery.error.status === 404;
  const pageTitle = cancelMutation.isSuccess
    ? 'Booking canceled'
    : bookingQuery.data
      ? 'Booking confirmed'
      : isNotFound
        ? 'Booking not found'
        : bookingQuery.isError
          ? 'Booking unavailable'
          : 'Booking confirmation';
  usePageTitle(pageTitle);

  if (cancelMutation.isSuccess) {
    return (
      <section
        className='guest-confirmation guest-confirmation-canceled'
        aria-labelledby='canceled-title'
      >
        <CircleX aria-hidden='true' />
        <h1 id='canceled-title'>Booking canceled</h1>
        <p>
          Your booking has been canceled. This time is now available for someone
          else.
        </p>
        <Link className='guest-primary-action' to='/guest'>
          Book another time
        </Link>
      </section>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <section className='guest-confirmation guest-state-panel'>
        <h1>Booking confirmation</h1>
        <p>Loading...</p>
      </section>
    );
  }

  if (bookingQuery.isError || !bookingQuery.data) {
    return isNotFound ? (
      <StateCard
        title='Booking not found'
        description='This link may be invalid, or the booking may have been canceled.'
      />
    ) : (
      <section className='guest-confirmation guest-state-panel'>
        <h1>Booking unavailable</h1>
        <p>We couldn’t load this booking. Try again.</p>
        <div className='guest-confirmation-actions'>
          <button
            className='guest-secondary-action'
            type='button'
            onClick={() => bookingQuery.refetch()}
          >
            Try again
          </button>
          <Link className='guest-primary-action' to='/guest'>
            Go to booking page
          </Link>
        </div>
      </section>
    );
  }

  const booking = bookingQuery.data;

  return (
    <section
      className='guest-confirmation'
      aria-labelledby='confirmation-title'
    >
      <CheckCircle2 aria-hidden='true' />
      <p className='guest-confirmation-kicker'>You’re all set</p>
      <h1 id='confirmation-title'>Booking confirmed</h1>
      <p className='guest-confirmation-title'>{booking.bookingType.title}</p>
      <dl className='guest-booking-summary'>
        <div>
          <dt>Name</dt>
          <dd>{booking.guest.name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{booking.guest.email}</dd>
        </div>
        <div>
          <dt>Booking type</dt>
          <dd>{booking.bookingType.title}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>
            <time dateTime={booking.timeSlot.startTime}>
              {formatTimeSlot(booking.timeSlot)}
            </time>
          </dd>
        </div>
      </dl>

      {cancelMutation.isError && (
        <p role='alert' className='guest-form-error'>
          We couldn’t cancel your booking. Try again.
        </p>
      )}

      {confirmingCancel ? (
        <div className='guest-cancel-box'>
          <h2>Cancel this booking?</h2>
          <p>This time will become available for someone else.</p>
          <div className='guest-confirmation-actions'>
            <button
              className='guest-secondary-action'
              onClick={() => setConfirmingCancel(false)}
              disabled={cancelMutation.isPending}
            >
              Keep booking
            </button>
            <button
              className='guest-danger-action'
              onClick={() => cancelMutation.mutate(booking.id)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Loading...' : 'Cancel booking'}
            </button>
          </div>
        </div>
      ) : (
        <div className='guest-confirmation-actions'>
          <button
            className='guest-link-action guest-link-action-danger'
            onClick={() => setConfirmingCancel(true)}
          >
            Cancel booking
          </button>
          <Link className='guest-primary-action' to='/guest'>
            Book another time
          </Link>
        </div>
      )}
    </section>
  );
}
