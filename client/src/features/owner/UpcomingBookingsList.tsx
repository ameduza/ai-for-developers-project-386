import { CalendarDays } from 'lucide-react';
import type { Booking } from '@/lib/api/generated';
import { formatTimeSlot } from '@/lib/formatters';

interface UpcomingBookingsListProps {
  bookings: Booking[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function UpcomingBookingsList({
  bookings,
  isLoading,
  isError,
  onRetry,
}: UpcomingBookingsListProps) {
  return (
    <div>
      <header className='flex items-end justify-between gap-4 border-b border-white/10 pb-5'>
        <div>
          <h2 className='text-2xl font-semibold tracking-tight text-white'>
            Upcoming bookings
          </h2>
        </div>
        <span className='rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400'>
          {bookings.length} confirmed
        </span>
      </header>

      {isLoading ? (
        <p className='py-8 text-sm text-slate-400'>Loading...</p>
      ) : isError ? (
        <div className='flex items-center justify-between gap-4 py-8'>
          <p className='text-sm text-rose-300'>
            We couldn’t load upcoming bookings. Try again.
          </p>
          <button
            type='button'
            onClick={onRetry}
            className='rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/5'
          >
            Try again
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className='grid min-h-80 place-items-center text-center'>
          <div>
            <span className='mx-auto grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-slate-400'>
              <CalendarDays aria-hidden='true' className='size-5' />
            </span>
            <p className='mt-4 text-sm font-medium text-slate-200'>
              No upcoming bookings.
            </p>
          </div>
        </div>
      ) : (
        <ol className='relative mt-6 space-y-4 before:absolute before:bottom-6 before:left-[15px] before:top-6 before:w-px before:bg-white/10'>
          {bookings.map((booking, index) => (
            <li
              key={booking.id}
              className='relative grid grid-cols-[32px_1fr] gap-4'
            >
              <span className='z-10 grid size-8 place-items-center rounded-full border border-white/10 bg-slate-900 text-xs font-semibold text-slate-400'>
                {index + 1}
              </span>
              <article className='rounded-xl border border-white/10 bg-white/[0.035] p-5'>
                <div className='flex items-start justify-between gap-4'>
                  <h3 className='font-semibold text-slate-100'>
                    {booking.bookingType.title}
                  </h3>
                  <span className='rounded-md bg-amber-300/10 px-2 py-1 text-xs font-medium text-amber-200'>
                    {booking.bookingType.durationMinutes} min
                  </span>
                </div>
                <dl className='mt-4 grid gap-3 text-sm'>
                  <div>
                    <dt className='text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500'>
                      Time
                    </dt>
                    <dd className='mt-1 text-slate-300'>
                      <time dateTime={booking.timeSlot.startTime}>
                        {formatTimeSlot(booking.timeSlot)}
                      </time>
                    </dd>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <dt className='text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500'>
                        Name
                      </dt>
                      <dd className='mt-1 text-slate-300'>
                        {booking.guest.name}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500'>
                        Email
                      </dt>
                      <dd className='mt-1 truncate'>
                        <a
                          className='text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-white'
                          href={`mailto:${booking.guest.email}`}
                        >
                          {booking.guest.email}
                        </a>
                      </dd>
                    </div>
                  </div>
                </dl>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
