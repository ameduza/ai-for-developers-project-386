import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { TimeSlot } from '@/lib/api/generated';
import {
  useGuestBookingTypesQuery,
  useGuestTimeSlotsQuery,
} from '@/features/guest/queries';
import { BookingForm } from '@/features/guest/BookingForm';
import { formatTimeSlot } from '@/features/guest/format-time-slot';
import { usePageTitle } from '@/lib/use-page-title';

const BOOKING_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isWithinBookingWindow(timeSlot: TimeSlot, now: number) {
  const startTime = new Date(timeSlot.startTime).getTime();

  return (
    Number.isFinite(startTime) &&
    startTime >= now &&
    startTime <= now + BOOKING_WINDOW_MS
  );
}

function utcDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function utcMonthKey(value: string) {
  return value.slice(0, 7);
}

function dateFromKey(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateFromKey(value));
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dateFromKey(`${value}-01`));
}

function shiftMonth(value: string, delta: number) {
  const date = dateFromKey(`${value}-01`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return utcDateKey(date).slice(0, 7);
}

function monthCells(month: string) {
  const first = dateFromKey(`${month}-01`);
  const year = first.getUTCFullYear();
  const monthIndex = first.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  return [
    ...Array.from<null>({ length: first.getUTCDay() }).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) =>
      utcDateKey(new Date(Date.UTC(year, monthIndex, index + 1))),
    ),
  ];
}

export function GuestBookingTypePage() {
  const { bookingTypeId } = useParams();
  const bookingTypesQuery = useGuestBookingTypesQuery();
  const timeSlotsQuery = useGuestTimeSlotsQuery(bookingTypeId);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<string | null>(null);
  const [step, setStep] = useState<'time' | 'details'>('time');
  const [guestDetails, setGuestDetails] = useState({ name: '', email: '' });
  const [timeConflict, setTimeConflict] = useState(false);
  const timeHeadingRef = useRef<HTMLHeadingElement>(null);
  usePageTitle(step === 'details' ? 'Enter your details' : 'Choose a time');
  const now = Date.now();
  const bookingType = bookingTypesQuery.data?.items.find(
    (candidate) => candidate.id === bookingTypeId,
  );
  const availableTimeSlots = useMemo(
    () =>
      (timeSlotsQuery.data?.items ?? [])
        .filter(
          (timeSlot) =>
            timeSlot.available && isWithinBookingWindow(timeSlot, now),
        )
        .sort((first, second) =>
          first.startTime.localeCompare(second.startTime),
        ),
    [now, timeSlotsQuery.data?.items],
  );
  const slotsByDate = useMemo(() => {
    const grouped = new Map<string, TimeSlot[]>();

    for (const timeSlot of availableTimeSlots) {
      const key = utcDateKey(timeSlot.startTime);
      grouped.set(key, [...(grouped.get(key) ?? []), timeSlot]);
    }

    return grouped;
  }, [availableTimeSlots]);
  const firstAvailableDate = slotsByDate.keys().next().value as
    string | undefined;
  const activeDate = selectedDate ?? firstAvailableDate ?? null;
  const activeMonth =
    visibleMonth ??
    (activeDate ? utcMonthKey(activeDate) : utcDateKey(new Date()).slice(0, 7));
  const selectedTimeSlot =
    availableTimeSlots.find((timeSlot) => timeSlot.id === selectedSlotId) ??
    null;
  const activeDateSlots = activeDate ? (slotsByDate.get(activeDate) ?? []) : [];
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
            onClick={() => {
              if (bookingTypesQuery.isError) {
                bookingTypesQuery.refetch();
              }
              if (timeSlotsQuery.isError) {
                timeSlotsQuery.refetch();
              }
            }}
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!bookingType) {
    return (
      <div className='guest-state-block'>
        <p className='guest-state-copy guest-state-copy-error'>
          We couldn’t load the available times. Try again.
        </p>
      </div>
    );
  }

  if (availableTimeSlots.length === 0) {
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
            onTimeUnavailable={(details) => {
              setGuestDetails(details);
              setSelectedSlotId(null);
              setTimeConflict(true);
              setStep('time');
            }}
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
