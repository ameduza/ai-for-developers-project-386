import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGuestBookingTypesQuery } from '@/features/guest/queries';
import { usePageTitle } from '@/lib/use-page-title';

export function GuestLandingPage() {
  usePageTitle('Choose a booking type');
  const bookingTypesQuery = useGuestBookingTypesQuery();
  const bookingTypes = bookingTypesQuery.data?.items ?? [];
  const retrying = bookingTypesQuery.isError && bookingTypesQuery.isFetching;

  return (
    <section className='guest-catalog' aria-labelledby='guest-catalog-title'>
      <header className='guest-step-heading'>
        <span aria-hidden='true'>01</span>
        <div>
          <p>Booking type catalog</p>
          <h1 id='guest-catalog-title'>Choose a booking type</h1>
        </div>
      </header>

      <div className='guest-catalog-list'>
        {bookingTypesQuery.isLoading ? (
          <p className='guest-state-copy'>Loading...</p>
        ) : bookingTypesQuery.isError ? (
          <div className='guest-state-block'>
            <p className='guest-state-copy guest-state-copy-error'>
              We couldn’t load the booking types. Try again.
            </p>
            <button
              className='guest-secondary-action'
              type='button'
              disabled={retrying}
              onClick={() => bookingTypesQuery.refetch()}
            >
              {retrying ? 'Loading...' : 'Try again'}
            </button>
          </div>
        ) : bookingTypes.length === 0 ? (
          <p className='guest-state-copy'>
            No booking types are available right now.
          </p>
        ) : (
          <ol>
            {bookingTypes.map((bookingType, index) => (
              <li key={bookingType.id}>
                <span className='guest-catalog-index' aria-hidden='true'>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className='guest-catalog-copy'>
                  <div>
                    <h2>{bookingType.title}</h2>
                    <span>{bookingType.durationMinutes} min</span>
                  </div>
                  <p>{bookingType.description}</p>
                </div>
                <Link
                  className='guest-pill-action'
                  to={`/guest/booking-types/${bookingType.id}`}
                >
                  View available times
                  <ArrowUpRight aria-hidden='true' />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
