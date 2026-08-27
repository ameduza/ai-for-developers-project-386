import { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BookingForm } from '@/features/guest/BookingForm';
import {
  formatMonth,
  formatUtcDate,
  monthCells,
  shiftMonth,
  utcDateKey,
} from '@/features/guest/calendar';
import { formatTimeSlot } from '@/features/guest/format-time-slot';
import { useGuestBookingFlow } from '@/features/guest/use-guest-booking-flow';
import { usePageTitle } from '@/lib/use-page-title';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function GuestBookingTypePage() {
  const { bookingTypeId } = useParams();
  const flow = useGuestBookingFlow(bookingTypeId);
  const {
    bookingTypesQuery,
    timeSlotsQuery,
    bookingType,
    setSelectedDate,
    selectedSlotId,
    setSelectedSlotId,
    setVisibleMonth,
    step,
    setStep,
    guestDetails,
    timeConflict,
    setTimeConflict,
    availableTimeSlots,
    slotsByDate,
    activeDate,
    activeMonth,
    selectedTimeSlot,
    activeDateSlots,
    rejectTimeSlot,
  } = flow;
  const timeHeadingRef = useRef<HTMLHeadingElement>(null);
  usePageTitle(step === 'details' ? 'Enter your details' : 'Choose a time');
  const isLoading = bookingTypesQuery.isLoading || timeSlotsQuery.isLoading;

  useEffect(() => {
    if (step === 'time' && timeConflict) {
      timeHeadingRef.current?.focus();
    }
  }, [step, timeConflict]);

  if (isLoading) {
    return <p className='guest-state-copy'>Loading...</p>;
  }

  if (bookingTypesQuery.isError || timeSlotsQuery.isError) {
    const retrying = bookingTypesQuery.isFetching || timeSlotsQuery.isFetching;

    return (
      <section className='guest-time-step' aria-labelledby='time-step-title'>
        <header className='guest-step-heading guest-step-heading-compact'>
          <span aria-hidden='true'>02</span>
          <div>
            <p>Time selection</p>
            <h1 id='time-step-title'>Choose a time</h1>
          </div>
        </header>
        <div className='guest-empty-state'>
          <CalendarDays aria-hidden='true' />
          <p>We couldn’t load the available times. Try again.</p>
          <button
            className='guest-secondary-action'
            type='button'
            disabled={retrying}
            onClick={() => {
              if (bookingTypesQuery.isError) {
                bookingTypesQuery.refetch();
              }
              if (timeSlotsQuery.isError) {
                timeSlotsQuery.refetch();
              }
            }}
          >
            {retrying ? 'Loading...' : 'Try again'}
          </button>
        </div>
      </section>
    );
  }

  if (!bookingType) {
    const retrying = bookingTypesQuery.isFetching || timeSlotsQuery.isFetching;

    return (
      <div className='guest-state-block'>
        <p className='guest-state-copy guest-state-copy-error'>
          We couldn’t load the available times. Try again.
        </p>
        <button
          className='guest-secondary-action'
          type='button'
          disabled={retrying}
          onClick={() => {
            bookingTypesQuery.refetch();
            timeSlotsQuery.refetch();
          }}
        >
          {retrying ? 'Loading...' : 'Try again'}
        </button>
      </div>
    );
  }

  if (availableTimeSlots.length === 0 && !timeConflict) {
    return (
      <section className='guest-time-step' aria-labelledby='time-step-title'>
        <header className='guest-step-heading guest-step-heading-compact'>
          <span aria-hidden='true'>02</span>
          <div>
            <p>Time selection</p>
            <h1 id='time-step-title'>Choose a time</h1>
          </div>
        </header>
        <div className='guest-empty-state'>
          <CalendarDays aria-hidden='true' />
          <p>No times are available in the next 14 days.</p>
          <Link className='guest-primary-action' to='/guest'>
            Choose another booking type
          </Link>
        </div>
      </section>
    );
  }

  if (step === 'details' && selectedTimeSlot && bookingTypeId) {
    return (
      <section className='guest-details-step' aria-labelledby='details-title'>
        <header className='guest-step-heading'>
          <span aria-hidden='true'>03</span>
          <div>
            <p>Guest details</p>
            <h1 id='details-title'>Enter your details</h1>
          </div>
        </header>
        <div className='guest-details-layout'>
          <aside>
            <CalendarDays aria-hidden='true' />
            <p>{bookingType.title}</p>
            <h2>{formatUtcDate(utcDateKey(selectedTimeSlot.startTime))}</h2>
            <span>{formatTimeSlot(selectedTimeSlot)}</span>
          </aside>
          <BookingForm
            bookingTypeId={bookingTypeId}
            timeSlot={selectedTimeSlot}
            initialGuestDetails={guestDetails}
            onTimeUnavailable={rejectTimeSlot}
          />
        </div>
      </section>
    );
  }

  return (
    <section className='guest-time-step' aria-labelledby='time-step-title'>
      <header className='guest-step-heading guest-step-heading-compact'>
        <span aria-hidden='true'>02</span>
        <div>
          <p>Time selection</p>
          <h1 id='time-step-title' ref={timeHeadingRef} tabIndex={-1}>
            Choose a time
          </h1>
        </div>
      </header>

      <div className='guest-calendar-layout'>
        <aside className='guest-booking-context'>
          <Link to='/guest' className='guest-back-link'>
            <ArrowLeft aria-hidden='true' /> Back to booking types
          </Link>
          <div>
            <span>Booking type</span>
            <h2>{bookingType.title}</h2>
            <p>{bookingType.description}</p>
            <strong>{bookingType.durationMinutes} min</strong>
          </div>
          <dl>
            <div>
              <dt>Date</dt>
              <dd>
                {activeDate ? formatUtcDate(activeDate) : 'Choose a date'}
              </dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>
                {selectedTimeSlot
                  ? formatTimeSlot(selectedTimeSlot)
                  : 'Choose a time'}
              </dd>
            </div>
          </dl>
        </aside>

        <section className='guest-calendar' aria-label='Calendar'>
          <header>
            <div>
              <span>Select a date</span>
              <h2>{formatMonth(activeMonth)}</h2>
            </div>
            <div className='guest-month-controls'>
              <button
                type='button'
                aria-label='Previous month'
                onClick={() => setVisibleMonth(shiftMonth(activeMonth, -1))}
              >
                <ChevronLeft aria-hidden='true' />
              </button>
              <button
                type='button'
                aria-label='Next month'
                onClick={() => setVisibleMonth(shiftMonth(activeMonth, 1))}
              >
                <ChevronRight aria-hidden='true' />
              </button>
            </div>
          </header>
          <div className='guest-weekdays' aria-hidden='true'>
            {WEEKDAYS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className='guest-calendar-grid'>
            {monthCells(activeMonth).map((date, index) => {
              if (!date) {
                return <span key={`empty-${index}`} />;
              }

              const count = slotsByDate.get(date)?.length ?? 0;
              const isSelected = date === activeDate;

              return (
                <button
                  key={date}
                  type='button'
                  aria-label={formatUtcDate(date)}
                  disabled={count === 0}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlotId(null);
                    setTimeConflict(false);
                  }}
                >
                  <span>{Number(date.slice(-2))}</span>
                  {count > 0 && <small>{count} free</small>}
                </button>
              );
            })}
          </div>
        </section>

        <section className='guest-times' aria-label='Available times'>
          <header>
            <span>Available times</span>
            <h2>{activeDate ? formatUtcDate(activeDate) : 'Choose a date'}</h2>
          </header>
          <div>
            {activeDateSlots.map((timeSlot) => (
              <button
                key={timeSlot.id}
                type='button'
                aria-pressed={selectedSlotId === timeSlot.id}
                onClick={() => {
                  setSelectedSlotId(timeSlot.id);
                  setTimeConflict(false);
                }}
              >
                <Clock3 aria-hidden='true' />
                <span>{formatTimeSlot(timeSlot)}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className='guest-time-actions'>
        <div>
          <p>Times are available for the next 14 days.</p>
          {timeConflict && (
            <p role='alert' className='guest-time-conflict'>
              This time is no longer available. Choose another time.
            </p>
          )}
        </div>
        <button
          className='guest-primary-action'
          type='button'
          disabled={!selectedTimeSlot}
          onClick={() => setStep('details')}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
