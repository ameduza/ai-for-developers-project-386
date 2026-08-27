import { OwnerProfile } from '@/features/owner/OwnerProfile';
import { BookingTypeCard } from '@/features/owner/BookingTypeCard';
import { CreateBookingTypeForm } from '@/features/owner/CreateBookingTypeForm';
import { UpcomingBookingsList } from '@/features/owner/UpcomingBookingsList';
import {
  useOwnerProfileQuery,
  useOwnerBookingTypesQuery,
  useOwnerUpcomingBookingsQuery,
} from '@/features/owner/queries';

export function OwnerDashboardPage() {
  const profileQuery = useOwnerProfileQuery();
  const bookingTypesQuery = useOwnerBookingTypesQuery();
  const upcomingBookingsQuery = useOwnerUpcomingBookingsQuery();
  const bookingTypes = bookingTypesQuery.data?.items ?? [];
  const upcomingBookings = upcomingBookingsQuery.data?.items ?? [];

  return (
    <div className='px-6 py-5'>
      <OwnerProfile
        owner={profileQuery.data}
        isLoading={profileQuery.isLoading}
        isError={profileQuery.isError}
        onRetry={() => void profileQuery.refetch()}
      />

      <div className='mt-5 grid min-h-[calc(100vh-9.75rem)] grid-cols-[minmax(270px,0.85fr)_minmax(430px,1.7fr)_minmax(220px,0.75fr)] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/30'>
        <section
          id='booking-types'
          aria-label='New Booking Type'
          className='border-r border-white/10 bg-slate-900/45 p-6'
        >
          <CreateBookingTypeForm />
        </section>

        <section id='bookings' className='min-w-0 px-7 py-6'>
          <UpcomingBookingsList
            bookings={upcomingBookings}
            isLoading={upcomingBookingsQuery.isLoading}
            isError={upcomingBookingsQuery.isError}
            onRetry={() => void upcomingBookingsQuery.refetch()}
          />
        </section>

        <aside
          aria-label='Published booking types'
          className='border-l border-white/10 bg-slate-900/30 px-5 py-6'
        >
          <header className='mb-5 flex items-end justify-between border-b border-white/10 pb-4'>
            <h2 className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-400'>
              Published
            </h2>
            <strong className='text-3xl font-semibold tracking-tight text-white'>
              {bookingTypes.length}
            </strong>
          </header>

          <div className='space-y-2'>
            {bookingTypesQuery.isLoading ? (
              <p className='text-sm text-slate-400'>Loading...</p>
            ) : bookingTypesQuery.isError ? (
              <div className='space-y-3'>
                <p className='text-sm leading-5 text-rose-300'>
                  We couldn’t load the booking types. Try again.
                </p>
                <button
                  type='button'
                  onClick={() => void bookingTypesQuery.refetch()}
                  className='rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/5'
                >
                  Try again
                </button>
              </div>
            ) : bookingTypes.length === 0 ? (
              <p className='text-sm text-slate-400'>No booking types yet.</p>
            ) : (
              bookingTypes.map((bookingType) => (
                <BookingTypeCard
                  key={bookingType.id}
                  bookingType={bookingType}
                />
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
