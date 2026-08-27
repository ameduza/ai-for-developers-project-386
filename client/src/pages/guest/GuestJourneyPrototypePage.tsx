// Three variants of the complete guest booking journey, switchable via
// `?variant=`, on the throwaway `/guest/prototype` route.
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  RotateCcw,
  UserRound,
  X,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PrototypeSwitcher,
  type PrototypeVariant,
} from '@/components/prototype/PrototypeSwitcher';
import './guest-journey-prototype.css';

type JourneyStep =
  'catalog' | 'time' | 'details' | 'confirmed' | 'cancel' | 'canceled';

type BookingType = {
  id: string;
  title: string;
  description: string;
  duration: number;
};

type Slot = {
  id: string;
  date: string;
  shortDate: string;
  weekday: string;
  time: string;
  full: string;
};

type JourneyState = {
  step: JourneyStep;
  bookingType: BookingType | null;
  selectedDate: string | null;
  slot: Slot | null;
  name: string;
  email: string;
};

type VariantProps = {
  state: JourneyState;
  setState: React.Dispatch<React.SetStateAction<JourneyState>>;
};

const BOOKING_TYPES: BookingType[] = [
  {
    id: 'quick-intro',
    title: 'Quick intro call',
    description: 'A focused conversation to meet and explore how we can help.',
    duration: 15,
  },
  {
    id: 'project-consultation',
    title: 'Project consultation',
    description: 'A practical session to discuss your project and next steps.',
    duration: 30,
  },
  {
    id: 'portfolio-review',
    title: 'Portfolio review',
    description:
      'Thoughtful feedback on your work, presentation, and direction.',
    duration: 45,
  },
];

const SLOTS: Slot[] = [
  {
    id: 'thu-0900',
    date: 'August 27',
    shortDate: '27',
    weekday: 'Thursday',
    time: '9:00 AM',
    full: 'August 27, 2026 · 9:00 AM–9:30 AM UTC',
  },
  {
    id: 'thu-1030',
    date: 'August 27',
    shortDate: '27',
    weekday: 'Thursday',
    time: '10:30 AM',
    full: 'August 27, 2026 · 10:30 AM–11:00 AM UTC',
  },
  {
    id: 'thu-1400',
    date: 'August 27',
    shortDate: '27',
    weekday: 'Thursday',
    time: '2:00 PM',
    full: 'August 27, 2026 · 2:00 PM–2:30 PM UTC',
  },
  {
    id: 'fri-0930',
    date: 'August 28',
    shortDate: '28',
    weekday: 'Friday',
    time: '9:30 AM',
    full: 'August 28, 2026 · 9:30 AM–10:00 AM UTC',
  },
  {
    id: 'fri-1300',
    date: 'August 28',
    shortDate: '28',
    weekday: 'Friday',
    time: '1:00 PM',
    full: 'August 28, 2026 · 1:00 PM–1:30 PM UTC',
  },
  {
    id: 'mon-1100',
    date: 'August 31',
    shortDate: '31',
    weekday: 'Monday',
    time: '11:00 AM',
    full: 'August 31, 2026 · 11:00 AM–11:30 AM UTC',
  },
];

const VARIANTS: PrototypeVariant[] = [
  { key: 'A', name: 'Guided canvas' },
  { key: 'B', name: 'Split planner' },
  { key: 'C', name: 'Editorial journey' },
];

const INITIAL_STATE: JourneyState = {
  step: 'catalog',
  bookingType: null,
  selectedDate: null,
  slot: null,
  name: '',
  email: '',
};

const JOURNEY_LABELS: Record<JourneyStep, string> = {
  catalog: 'Booking type catalog',
  time: 'Time selection',
  details: 'Guest details',
  confirmed: 'Booking confirmed',
  cancel: 'Cancellation check',
  canceled: 'Booking canceled',
};

function PublicHeader() {
  return (
    <header className='guest-prototype-header'>
      <Link to='/' className='guest-prototype-brand'>
        <span className='guest-prototype-mark'>B</span>
        Booking Service
      </Link>
      <Link to='/owner' className='guest-prototype-owner-link'>
        Owner workspace <ArrowRight size={15} />
      </Link>
    </header>
  );
}

function OwnerIdentity({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`prototype-owner ${compact ? 'is-compact' : ''}`}>
      <span className='prototype-avatar' aria-hidden='true'>
        T
      </span>
      <span>
        <strong>Tota</strong>
        <small>Product designer</small>
      </span>
    </div>
  );
}

function BookingTypeCards({
  onSelect,
  mode = 'cards',
}: {
  onSelect: (bookingType: BookingType) => void;
  mode?: 'cards' | 'list' | 'editorial';
}) {
  return (
    <div className={`prototype-booking-types mode-${mode}`}>
      {BOOKING_TYPES.map((bookingType, index) => (
        <article className='prototype-booking-type' key={bookingType.id}>
          {mode === 'editorial' && (
            <span className='prototype-index'>0{index + 1}</span>
          )}
          <div className='prototype-booking-copy'>
            <div className='prototype-title-line'>
              <h2>{bookingType.title}</h2>
              <span>{bookingType.duration} min</span>
            </div>
            <p>{bookingType.description}</p>
          </div>
          <button type='button' onClick={() => onSelect(bookingType)}>
            <span>View available times</span>
            <ChevronRight size={17} />
          </button>
        </article>
      ))}
    </div>
  );
}

function DayPicker({
  selectedSlot,
  onSelect,
  mode = 'grid',
}: {
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
  mode?: 'grid' | 'columns' | 'timeline';
}) {
  const days = [
    { label: 'Thursday', date: 'August 27', short: '27' },
    { label: 'Friday', date: 'August 28', short: '28' },
    { label: 'Monday', date: 'August 31', short: '31' },
  ];

  return (
    <div className={`prototype-slots mode-${mode}`}>
      {days.map((day) => (
        <section key={day.date} className='prototype-slot-day'>
          <header>
            <span>{day.label}</span>
            <strong>{mode === 'timeline' ? day.date : day.short}</strong>
          </header>
          <div>
            {SLOTS.filter((slot) => slot.date === day.date).map((slot) => (
              <button
                type='button'
                key={slot.id}
                aria-label={slot.full}
                aria-pressed={selectedSlot?.id === slot.id}
                className={selectedSlot?.id === slot.id ? 'is-selected' : ''}
                onClick={() => onSelect(slot)}
              >
                <Clock3 size={15} />
                <span>{slot.time}</span>
                {selectedSlot?.id === slot.id && <Check size={15} />}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

type CalendarDay = {
  day: number;
  outside?: boolean;
  date?: string;
  available?: number;
};

const CALENDAR_WEEKS: CalendarDay[][] = [
  [
    { day: 27, outside: true },
    { day: 28, outside: true },
    { day: 29, outside: true },
    { day: 30, outside: true },
    { day: 31, outside: true },
    { day: 1 },
    { day: 2 },
  ],
  [
    { day: 3 },
    { day: 4 },
    { day: 5 },
    { day: 6 },
    { day: 7 },
    { day: 8 },
    { day: 9 },
  ],
  [
    { day: 10 },
    { day: 11 },
    { day: 12 },
    { day: 13 },
    { day: 14 },
    { day: 15 },
    { day: 16 },
  ],
  [
    { day: 17 },
    { day: 18 },
    { day: 19 },
    { day: 20 },
    { day: 21 },
    { day: 22 },
    { day: 23 },
  ],
  [
    { day: 24 },
    { day: 25 },
    { day: 26 },
    { day: 27, date: 'August 27', available: 3 },
    { day: 28, date: 'August 28', available: 2 },
    { day: 29 },
    { day: 30 },
  ],
  [
    { day: 31, date: 'August 31', available: 1 },
    { day: 1, outside: true },
    { day: 2, outside: true },
    { day: 3, outside: true },
    { day: 4, outside: true },
    { day: 5, outside: true },
    { day: 6, outside: true },
  ],
];

function CalendarTimePicker({ state, setState }: VariantProps) {
  const selectedDate = state.selectedDate ?? 'August 27';
  const availableSlots = SLOTS.filter((slot) => slot.date === selectedDate);

  return (
    <div className='variant-c-calendar-layout'>
      <aside className='variant-c-booking-context'>
        <OwnerIdentity compact />
        <div>
          <span>Booking type</span>
          <h2>{state.bookingType?.title}</h2>
          <p>{state.bookingType?.description}</p>
          <strong>{state.bookingType?.duration} min</strong>
        </div>
        <dl>
          <div>
            <dt>Selected date</dt>
            <dd>{selectedDate}</dd>
          </div>
          <div>
            <dt>Selected time</dt>
            <dd>{state.slot ? `${state.slot.time} UTC` : 'Choose a time'}</dd>
          </div>
        </dl>
      </aside>

      <section className='variant-c-calendar' aria-label='August 2026 calendar'>
        <header>
          <div>
            <span>Calendar</span>
            <h2>August 2026</h2>
          </div>
          <div className='variant-c-month-controls' aria-hidden='true'>
            <button type='button' disabled>
              <ArrowLeft size={14} />
            </button>
            <button type='button' disabled>
              <ArrowRight size={14} />
            </button>
          </div>
        </header>
        <div className='variant-c-weekdays' aria-hidden='true'>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className='variant-c-calendar-grid'>
          {CALENDAR_WEEKS.flatMap((week, weekIndex) =>
            week.map((day, dayIndex) => {
              const isSelected = day.date === selectedDate;
              const isAvailable = Boolean(day.date);
              return (
                <button
                  type='button'
                  key={`${weekIndex}-${dayIndex}`}
                  disabled={!isAvailable}
                  className={[
                    day.outside ? 'is-outside' : '',
                    isAvailable ? 'is-available' : '',
                    isSelected ? 'is-selected' : '',
                  ].join(' ')}
                  aria-label={
                    day.date
                      ? `${day.date}, ${day.available} available ${day.available === 1 ? 'time' : 'times'}`
                      : undefined
                  }
                  aria-pressed={isAvailable ? isSelected : undefined}
                  onClick={() =>
                    day.date &&
                    setState((current) => ({
                      ...current,
                      selectedDate: day.date ?? null,
                      slot: null,
                    }))
                  }
                >
                  <span>{day.day}</span>
                  {day.available && <small>{day.available} times</small>}
                </button>
              );
            }),
          )}
        </div>
      </section>

      <aside className='variant-c-times'>
        <header>
          <span>Available times</span>
          <h2>{selectedDate}</h2>
        </header>
        <div>
          {availableSlots.map((slot) => (
            <button
              type='button'
              key={slot.id}
              aria-label={slot.full}
              aria-pressed={state.slot?.id === slot.id}
              className={state.slot?.id === slot.id ? 'is-selected' : ''}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  selectedDate: slot.date,
                  slot,
                }))
              }
            >
              <span>{slot.full.split(' · ')[1]}</span>
              {state.slot?.id === slot.id ? (
                <Check size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function BookingSummary({ state }: { state: JourneyState }) {
  return (
    <dl className='prototype-summary'>
      <div>
        <dt>Name</dt>
        <dd>{state.name || '—'}</dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd>{state.email || '—'}</dd>
      </div>
      <div>
        <dt>Booking type</dt>
        <dd>{state.bookingType?.title ?? '—'}</dd>
      </div>
      <div>
        <dt>Time</dt>
        <dd>{state.slot?.full ?? '—'}</dd>
      </div>
    </dl>
  );
}

function DetailsForm({
  state,
  setState,
  compact = false,
}: VariantProps & { compact?: boolean }) {
  const canSubmit = state.name.trim() !== '' && state.email.includes('@');

  return (
    <form
      className={`prototype-form ${compact ? 'is-compact' : ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          setState((current) => ({ ...current, step: 'confirmed' }));
        }
      }}
    >
      <label>
        <span>Name</span>
        <input
          value={state.name}
          onChange={(event) =>
            setState((current) => ({ ...current, name: event.target.value }))
          }
          autoComplete='name'
        />
      </label>
      <label>
        <span>Email</span>
        <input
          type='email'
          value={state.email}
          onChange={(event) =>
            setState((current) => ({ ...current, email: event.target.value }))
          }
          autoComplete='email'
        />
      </label>
      <button className='prototype-primary' type='submit' disabled={!canSubmit}>
        Confirm booking
      </button>
    </form>
  );
}

function SuccessPanel({ state, setState }: VariantProps) {
  const isCanceling = state.step === 'cancel';

  return (
    <div className='prototype-success'>
      <CheckCircle2 size={34} strokeWidth={1.6} />
      <p className='prototype-kicker'>You’re all set</p>
      <h1>Booking confirmed</h1>
      <p className='prototype-success-title'>{state.bookingType?.title}</p>
      <BookingSummary state={state} />
      {isCanceling ? (
        <div className='prototype-cancel-box'>
          <h2>Cancel this booking?</h2>
          <p>This time will become available for someone else.</p>
          <div className='prototype-actions'>
            <button
              type='button'
              className='prototype-secondary'
              onClick={() =>
                setState((current) => ({ ...current, step: 'confirmed' }))
              }
            >
              Keep booking
            </button>
            <button
              type='button'
              className='prototype-danger'
              onClick={() =>
                setState((current) => ({ ...current, step: 'canceled' }))
              }
            >
              Cancel booking
            </button>
          </div>
        </div>
      ) : (
        <div className='prototype-actions'>
          <button
            type='button'
            className='prototype-link-button danger-link'
            onClick={() =>
              setState((current) => ({ ...current, step: 'cancel' }))
            }
          >
            Cancel booking
          </button>
          <button
            type='button'
            className='prototype-primary'
            onClick={() => setState(INITIAL_STATE)}
          >
            Book another time
          </button>
        </div>
      )}
    </div>
  );
}

function CanceledPanel({ setState }: Pick<VariantProps, 'setState'>) {
  return (
    <div className='prototype-success is-canceled'>
      <span className='prototype-canceled-icon'>
        <X size={24} />
      </span>
      <h1>Booking canceled</h1>
      <p>
        Your booking has been canceled. This time is now available for someone
        else.
      </p>
      <button
        type='button'
        className='prototype-primary'
        onClick={() => setState(INITIAL_STATE)}
      >
        Book another time
      </button>
    </div>
  );
}

function StepHeading({ state }: { state: JourneyState }) {
  if (state.step === 'catalog') {
    return (
      <>
        <p className='prototype-kicker'>Book with Tota</p>
        <h1>Choose a booking type</h1>
      </>
    );
  }

  if (state.step === 'time') {
    return (
      <>
        <p className='prototype-kicker'>
          {state.bookingType?.title} · {state.bookingType?.duration} min
        </p>
        <h1>Choose a time</h1>
        <p className='prototype-guidance'>
          Times are available for the next 14 days.
        </p>
      </>
    );
  }

  return (
    <>
      <p className='prototype-kicker'>One last step</p>
      <h1>Enter your details</h1>
      <p className='prototype-guidance'>
        {state.bookingType?.title} · {state.slot?.full}
      </p>
    </>
  );
}

function VariantA({ state, setState }: VariantProps) {
  const chooseType = (bookingType: BookingType) =>
    setState((current) => ({
      ...current,
      bookingType,
      selectedDate: null,
      slot: null,
      step: 'time',
    }));

  return (
    <div className='variant-a'>
      <PublicHeader />
      <main>
        {state.step === 'confirmed' || state.step === 'cancel' ? (
          <SuccessPanel state={state} setState={setState} />
        ) : state.step === 'canceled' ? (
          <CanceledPanel setState={setState} />
        ) : (
          <>
            <div className='variant-a-progress'>
              {['Booking type', 'Time', 'Details'].map((label, index) => (
                <span
                  key={label}
                  className={
                    index <= ['catalog', 'time', 'details'].indexOf(state.step)
                      ? 'is-active'
                      : ''
                  }
                >
                  <i>{index + 1}</i> {label}
                </span>
              ))}
            </div>
            <section className='variant-a-canvas'>
              <header className='variant-a-heading'>
                <OwnerIdentity compact />
                <div>
                  <StepHeading state={state} />
                </div>
              </header>
              {state.step === 'catalog' && (
                <BookingTypeCards onSelect={chooseType} />
              )}
              {state.step === 'time' && (
                <>
                  <DayPicker
                    selectedSlot={state.slot}
                    onSelect={(slot) =>
                      setState((current) => ({
                        ...current,
                        selectedDate: slot.date,
                        slot,
                      }))
                    }
                  />
                  <div className='prototype-footer-actions'>
                    <button
                      type='button'
                      className='prototype-link-button'
                      onClick={() =>
                        setState((current) => ({
                          ...current,
                          step: 'catalog',
                        }))
                      }
                    >
                      <ArrowLeft size={15} /> Back to booking types
                    </button>
                    <button
                      type='button'
                      className='prototype-primary'
                      disabled={!state.slot}
                      onClick={() =>
                        setState((current) => ({
                          ...current,
                          step: 'details',
                        }))
                      }
                    >
                      Continue <ArrowRight size={15} />
                    </button>
                  </div>
                </>
              )}
              {state.step === 'details' && (
                <div className='variant-a-details'>
                  <DetailsForm state={state} setState={setState} />
                  <aside>
                    <h2>Your booking</h2>
                    <BookingSummary state={state} />
                    <button
                      type='button'
                      className='prototype-link-button'
                      onClick={() =>
                        setState((current) => ({ ...current, step: 'time' }))
                      }
                    >
                      Change time
                    </button>
                  </aside>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function VariantB({ state, setState }: VariantProps) {
  const chooseType = (bookingType: BookingType) =>
    setState((current) => ({
      ...current,
      bookingType,
      selectedDate: null,
      slot: null,
      step: 'time',
    }));

  return (
    <div className='variant-b'>
      <PublicHeader />
      <main className='variant-b-shell'>
        <aside className='variant-b-sidebar'>
          <OwnerIdentity />
          <div className='variant-b-sidebar-copy'>
            <p>Personal booking page</p>
            <h2>Let’s find a time for a thoughtful conversation.</h2>
          </div>
          <ol>
            {[
              'Choose a booking type',
              'Choose a time',
              'Enter your details',
            ].map((label, index) => {
              const activeIndex = ['catalog', 'time', 'details'].indexOf(
                state.step,
              );
              return (
                <li
                  key={label}
                  className={index === activeIndex ? 'is-active' : ''}
                >
                  <span>
                    {index < activeIndex ? <Check size={14} /> : index + 1}
                  </span>
                  {label}
                </li>
              );
            })}
          </ol>
          <div className='variant-b-live-state'>
            <small>Current selection</small>
            <strong>
              {state.bookingType?.title ?? 'Nothing selected yet'}
            </strong>
            <span>{state.slot?.full ?? 'Choose a booking type to begin.'}</span>
          </div>
        </aside>
        <section className='variant-b-content'>
          {state.step === 'confirmed' || state.step === 'cancel' ? (
            <SuccessPanel state={state} setState={setState} />
          ) : state.step === 'canceled' ? (
            <CanceledPanel setState={setState} />
          ) : (
            <>
              <header>
                <StepHeading state={state} />
              </header>
              {state.step === 'catalog' && (
                <BookingTypeCards onSelect={chooseType} mode='list' />
              )}
              {state.step === 'time' && (
                <>
                  <DayPicker
                    selectedSlot={state.slot}
                    mode='columns'
                    onSelect={(slot) =>
                      setState((current) => ({
                        ...current,
                        selectedDate: slot.date,
                        slot,
                      }))
                    }
                  />
                  <div className='prototype-footer-actions'>
                    <button
                      type='button'
                      className='prototype-link-button'
                      onClick={() =>
                        setState((current) => ({
                          ...current,
                          step: 'catalog',
                        }))
                      }
                    >
                      Back to booking types
                    </button>
                    <button
                      type='button'
                      className='prototype-primary'
                      disabled={!state.slot}
                      onClick={() =>
                        setState((current) => ({
                          ...current,
                          step: 'details',
                        }))
                      }
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}
              {state.step === 'details' && (
                <div className='variant-b-details'>
                  <BookingSummary state={state} />
                  <DetailsForm state={state} setState={setState} compact />
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function VariantC({ state, setState }: VariantProps) {
  const chooseType = (bookingType: BookingType) =>
    setState((current) => ({
      ...current,
      bookingType,
      selectedDate: 'August 27',
      slot: null,
      step: 'time',
    }));

  const number =
    state.step === 'catalog' ? '01' : state.step === 'time' ? '02' : '03';

  return (
    <div className='variant-c'>
      <PublicHeader />
      <main className={state.step === 'time' ? 'is-time-step' : undefined}>
        {state.step === 'confirmed' || state.step === 'cancel' ? (
          <SuccessPanel state={state} setState={setState} />
        ) : state.step === 'canceled' ? (
          <CanceledPanel setState={setState} />
        ) : (
          <>
            <section
              className={`variant-c-intro ${state.step === 'time' ? 'is-compact' : ''}`}
            >
              <div>
                <span className='variant-c-number'>{number}</span>
                <StepHeading state={state} />
              </div>
              <OwnerIdentity compact />
            </section>
            <section className='variant-c-workspace'>
              {state.step === 'catalog' && (
                <BookingTypeCards onSelect={chooseType} mode='editorial' />
              )}
              {state.step === 'time' && (
                <>
                  <CalendarTimePicker state={state} setState={setState} />
                  <div className='prototype-footer-actions'>
                    <button
                      type='button'
                      className='prototype-link-button'
                      onClick={() =>
                        setState((current) => ({
                          ...current,
                          step: 'catalog',
                        }))
                      }
                    >
                      Back to booking types
                    </button>
                    <button
                      type='button'
                      className='prototype-primary'
                      disabled={!state.slot}
                      onClick={() =>
                        setState((current) => ({
                          ...current,
                          step: 'details',
                        }))
                      }
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}
              {state.step === 'details' && (
                <div className='variant-c-details'>
                  <aside>
                    <CalendarDays size={26} />
                    <p>{state.bookingType?.title}</p>
                    <h2>{state.slot?.date}</h2>
                    <span>{state.slot?.time} UTC</span>
                  </aside>
                  <DetailsForm state={state} setState={setState} />
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export function GuestJourneyPrototypePage() {
  const [searchParams] = useSearchParams();
  const requestedVariant = searchParams.get('variant')?.toUpperCase() ?? 'A';
  const variant = VARIANTS.some(
    (candidate) => candidate.key === requestedVariant,
  )
    ? requestedVariant
    : 'A';
  const [state, setState] = useState<JourneyState>(INITIAL_STATE);

  useEffect(() => {
    document.title = 'Guest booking prototype | Booking Service';
  }, []);

  const props = { state, setState };

  return (
    <div className='guest-journey-prototype'>
      {variant === 'A' && <VariantA {...props} />}
      {variant === 'B' && <VariantB {...props} />}
      {variant === 'C' && <VariantC {...props} />}
      {import.meta.env.DEV && (
        <aside className='prototype-state' aria-label='Prototype state'>
          <UserRound size={14} />
          <span>{JOURNEY_LABELS[state.step]}</span>
          <span>{state.bookingType?.title ?? 'No booking type'}</span>
          <span>{state.slot?.time ?? 'No time'}</span>
          <button type='button' onClick={() => setState(INITIAL_STATE)}>
            <RotateCcw size={13} /> Reset
          </button>
        </aside>
      )}
      <PrototypeSwitcher variants={VARIANTS} current={variant} />
    </div>
  );
}
