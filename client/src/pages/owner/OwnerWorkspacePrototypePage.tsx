// PROTOTYPE #76 — Three dark Owner-workspace variants, switchable via
// ?variant=A|B|C and previewable with ?state=populated|empty|live on /owner.
import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  Inbox,
  LayoutGrid,
  ListFilter,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import type { Booking, BookingType, Owner } from '@/lib/api/generated';
import { PrototypeSwitcher } from '@/components/prototype/PrototypeSwitcher';
import {
  useOwnerBookingTypesQuery,
  useOwnerProfileQuery,
  useOwnerUpcomingBookingsQuery,
} from '@/features/owner/queries';
import './owner-workspace-prototype.css';

const VARIANTS = [
  { key: 'A', name: 'Focused list' },
  { key: 'B', name: 'Booking studio' },
  { key: 'C', name: 'Command center' },
] as const;

type PreviewState = 'populated' | 'empty' | 'live';

const fallbackOwner: Owner = {
  id: 'owner-prototype',
  name: 'Alex Morgan',
  bio: 'Product designer and systems thinker.',
};

const fallbackBookingTypes: BookingType[] = [
  {
    id: 'introductory-call',
    title: 'Introductory call',
    description: 'A short call to discuss your goals and next steps.',
    durationMinutes: 30,
  },
  {
    id: 'deep-dive-consultation',
    title: 'Deep-dive consultation',
    description: 'A focused session for exploring a specific challenge.',
    durationMinutes: 60,
  },
  {
    id: 'strategy-workshop',
    title: 'Strategy workshop',
    description: 'A longer workshop to turn ideas into an actionable plan.',
    durationMinutes: 90,
  },
];

const fallbackBookings: Booking[] = [
  {
    id: 'booking-1',
    bookingType: fallbackBookingTypes[0],
    timeSlot: {
      id: 'slot-1',
      startTime: '2026-08-28T13:30:00.000Z',
      endTime: '2026-08-28T14:00:00.000Z',
      available: false,
    },
    guest: { name: 'Maya Chen', email: 'maya@example.com' },
  },
  {
    id: 'booking-2',
    bookingType: fallbackBookingTypes[1],
    timeSlot: {
      id: 'slot-2',
      startTime: '2026-09-01T09:00:00.000Z',
      endTime: '2026-09-01T10:00:00.000Z',
      available: false,
    },
    guest: { name: 'Noah Williams', email: 'noah@example.com' },
  },
  {
    id: 'booking-3',
    bookingType: fallbackBookingTypes[2],
    timeSlot: {
      id: 'slot-3',
      startTime: '2026-09-03T15:00:00.000Z',
      endTime: '2026-09-03T16:30:00.000Z',
      available: false,
    },
    guest: { name: 'Sam Rivera', email: 'sam@example.com' },
  },
];

interface WorkspaceProps {
  owner: Owner;
  bookingTypes: BookingType[];
  bookings: Booking[];
  isLoading: boolean;
  isError: boolean;
}

function formatBookingDate(booking: Booking) {
  const start = new Date(booking.timeSlot.startTime);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(start);
}

function formatBookingTime(booking: Booking) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  return `${formatter.format(new Date(booking.timeSlot.startTime))}–${formatter.format(new Date(booking.timeSlot.endTime))} UTC`;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function StateSelector({ current }: { current: PreviewState }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const update = (state: PreviewState) => {
    const params = new URLSearchParams(searchParams);
    params.set('state', state);
    setSearchParams(params, { replace: true });
  };

  if (import.meta.env.PROD) return null;
  return (
    <div className='prototype-state' aria-label='Preview data state'>
      <span>Preview</span>
      {(['populated', 'empty', 'live'] as const).map((state) => (
        <button
          type='button'
          className={current === state ? 'is-active' : ''}
          onClick={() => update(state)}
          key={state}
        >
          {state}
        </button>
      ))}
    </div>
  );
}

function Brand() {
  return (
    <div className='ow-brand'>
      <span className='ow-brand-mark'>B</span>
      <span>Booking Service</span>
    </div>
  );
}

function OwnerAvatar({ owner }: { owner: Owner }) {
  return <span className='ow-avatar'>{initials(owner.name)}</span>;
}

function EmptyBookings({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`ow-empty ${compact ? 'is-compact' : ''}`}>
      <span className='ow-empty-icon'>
        <CalendarDays size={20} />
      </span>
      <h2>No upcoming Bookings</h2>
      <p>When a Guest books a Time Slot, their Booking will appear here.</p>
      <Link to='/guest' className='ow-secondary-action'>
        View booking page <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}

function ErrorNotice() {
  return (
    <div className='ow-notice'>
      <Inbox size={18} />
      <div>
        <strong>Could not load workspace data</strong>
        <span>Check the local API and try again.</span>
      </div>
    </div>
  );
}

function CreateSheet({ onClose }: { onClose: () => void }) {
  const [created, setCreated] = useState(false);
  return (
    <div
      className='ow-sheet-backdrop'
      role='presentation'
      onMouseDown={onClose}
    >
      <section
        className='ow-sheet'
        role='dialog'
        aria-modal='true'
        aria-labelledby='sheet-title'
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className='ow-kicker'>New Booking Type</span>
            <h2 id='sheet-title'>What can Guests book?</h2>
          </div>
          <button
            type='button'
            className='ow-icon-button'
            onClick={onClose}
            aria-label='Close'
          >
            <X size={18} />
          </button>
        </header>
        {created ? (
          <div className='ow-created'>
            <span>
              <Check size={22} />
            </span>
            <h3>Booking Type ready</h3>
            <p>This prototype does not save changes to the API.</p>
            <button
              type='button'
              className='ow-primary-action'
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setCreated(true);
            }}
          >
            <label>
              Title
              <input required defaultValue='Portfolio review' />
            </label>
            <label>
              Description
              <textarea
                required
                rows={4}
                defaultValue='A focused review of your portfolio and next steps.'
              />
            </label>
            <label>
              Duration
              <select defaultValue='30'>
                <option value='30'>30 minutes</option>
                <option value='60'>60 minutes</option>
                <option value='90'>90 minutes</option>
              </select>
            </label>
            <div className='ow-sheet-actions'>
              <button
                type='button'
                className='ow-secondary-action'
                onClick={onClose}
              >
                Cancel
              </button>
              <button type='submit' className='ow-primary-action'>
                Create Booking Type
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function Sidebar({
  owner,
  active = 'Bookings',
}: {
  owner: Owner;
  active?: string;
}) {
  const links: [string, ReactNode][] = [
    ['Bookings', <CalendarDays size={17} key='bookings' />],
    ['Booking Types', <BookOpen size={17} key='types' />],
  ];
  return (
    <aside className='ow-sidebar'>
      <Brand />
      <nav aria-label='Owner workspace'>
        {links.map(([label, icon]) => (
          <button
            className={active === label ? 'is-active' : ''}
            type='button'
            key={label}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>
      <div className='ow-sidebar-bottom'>
        <Link to='/guest'>
          <ExternalLink size={16} />
          View booking page
        </Link>
        <button type='button'>
          <Settings size={16} />
          Settings
        </button>
        <div className='ow-owner-chip'>
          <OwnerAvatar owner={owner} />
          <span>
            <strong>{owner.name}</strong>
            <small>Owner</small>
          </span>
          <MoreHorizontal size={16} />
        </div>
      </div>
    </aside>
  );
}

function VariantA({
  owner,
  bookingTypes,
  bookings,
  isLoading,
  isError,
}: WorkspaceProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <div className='ow-shell variant-a'>
      <Sidebar owner={owner} />
      <main className='ow-main'>
        <header className='ow-topbar'>
          <div>
            <span className='ow-kicker'>Workspace</span>
            <h1>Upcoming Bookings</h1>
          </div>
          <div className='ow-top-actions'>
            <button className='ow-secondary-action' type='button'>
              <Search size={15} />
              Search
            </button>
            <button
              className='ow-primary-action'
              type='button'
              onClick={() => setSheetOpen(true)}
            >
              <Plus size={16} />
              New Booking Type
            </button>
          </div>
        </header>
        <div className='ow-tabs-row'>
          <div className='ow-tabs'>
            <button className='is-active'>Upcoming</button>
            <button>Past</button>
          </div>
          <button className='ow-filter' type='button'>
            <ListFilter size={15} />
            All Booking Types
            <ChevronDown size={14} />
          </button>
        </div>
        {isError && <ErrorNotice />}
        <section className='a-bookings-frame' aria-label='Upcoming Bookings'>
          {isLoading ? (
            <div className='ow-loading'>Loading...</div>
          ) : bookings.length === 0 ? (
            <EmptyBookings />
          ) : (
            <>
              <div className='a-section-label'>Next</div>
              <div className='a-booking-list'>
                {bookings.map((booking) => (
                  <article key={booking.id} className='a-booking-row'>
                    <div className='a-date'>
                      <strong>{formatBookingDate(booking)}</strong>
                      <span>{formatBookingTime(booking)}</span>
                    </div>
                    <div className='a-booking-copy'>
                      <strong>{booking.bookingType.title}</strong>
                      <span>
                        {booking.guest.name} · {booking.guest.email}
                      </span>
                    </div>
                    <span className='a-duration'>
                      <Clock3 size={14} />
                      {booking.bookingType.durationMinutes} min
                    </span>
                    <button
                      className='ow-icon-button'
                      type='button'
                      aria-label='Booking menu'
                    >
                      <MoreHorizontal size={17} />
                    </button>
                  </article>
                ))}
              </div>
              <footer className='a-footer'>
                <span>{bookings.length} upcoming</span>
                <span>Across {bookingTypes.length} Booking Types</span>
              </footer>
            </>
          )}
        </section>
      </main>
      {sheetOpen && <CreateSheet onClose={() => setSheetOpen(false)} />}
    </div>
  );
}

function InlineBuilder() {
  const [created, setCreated] = useState(false);
  return (
    <form
      className='b-builder'
      onSubmit={(event) => {
        event.preventDefault();
        setCreated(true);
      }}
    >
      <div className='b-builder-heading'>
        <span>
          <Sparkles size={15} />
          Create
        </span>
        <h2>New Booking Type</h2>
        <p>Publish another way for Guests to book your time.</p>
      </div>
      <label>
        Title
        <input defaultValue='Portfolio review' />
      </label>
      <div className='b-builder-grid'>
        <label>
          Duration
          <select defaultValue='30'>
            <option>30</option>
            <option>60</option>
            <option>90</option>
          </select>
        </label>
        <label>
          Unit
          <input value='minutes' readOnly />
        </label>
      </div>
      <label>
        Description
        <textarea
          rows={3}
          defaultValue='A focused review of your portfolio and next steps.'
        />
      </label>
      {created && (
        <p className='b-success'>
          <Check size={14} />
          Prototype only — ready to create.
        </p>
      )}
      <button className='ow-primary-action' type='submit'>
        Create Booking Type
        <ArrowUpRight size={15} />
      </button>
    </form>
  );
}

function VariantB({
  owner,
  bookingTypes,
  bookings,
  isLoading,
  isError,
}: WorkspaceProps) {
  return (
    <div className='ow-shell variant-b'>
      <aside className='b-rail'>
        <span className='ow-brand-mark'>B</span>
        <nav>
          <button className='is-active' aria-label='Bookings'>
            <CalendarDays size={19} />
          </button>
          <button aria-label='Booking Types'>
            <LayoutGrid size={19} />
          </button>
        </nav>
        <OwnerAvatar owner={owner} />
      </aside>
      <main className='b-workspace'>
        <header className='b-header'>
          <div>
            <Brand />
            <span className='b-divider' />
            <span>Owner studio</span>
          </div>
          <Link to='/guest'>
            View booking page <ArrowUpRight size={14} />
          </Link>
        </header>
        <div className='b-columns'>
          <InlineBuilder />
          <section className='b-bookings'>
            <header>
              <div>
                <span className='ow-kicker'>All Booking Types</span>
                <h1>Upcoming Bookings</h1>
                <p>
                  {bookings.length} confirmed · {bookingTypes.length} published
                  types
                </p>
              </div>
              <button className='ow-icon-button'>
                <ListFilter size={17} />
              </button>
            </header>
            {isError && <ErrorNotice />}
            {isLoading ? (
              <div className='ow-loading'>Loading...</div>
            ) : bookings.length === 0 ? (
              <EmptyBookings compact />
            ) : (
              <div className='b-timeline'>
                {bookings.map((booking, index) => (
                  <article className='b-booking' key={booking.id}>
                    <span className='b-line'>{index + 1}</span>
                    <div className='b-date'>
                      <strong>{formatBookingDate(booking)}</strong>
                      <span>{formatBookingTime(booking)}</span>
                    </div>
                    <div className='b-card'>
                      <header>
                        <span className='ow-avatar'>
                          {initials(booking.guest.name)}
                        </span>
                        <div>
                          <strong>{booking.guest.name}</strong>
                          <span>{booking.guest.email}</span>
                        </div>
                        <MoreHorizontal size={17} />
                      </header>
                      <footer>
                        <span>{booking.bookingType.title}</span>
                        <small>{booking.bookingType.durationMinutes} min</small>
                      </footer>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <aside className='b-types'>
            <header>
              <span>Published</span>
              <strong>{bookingTypes.length}</strong>
            </header>
            {bookingTypes.length === 0 ? (
              <p>No Booking Types yet.</p>
            ) : (
              bookingTypes.map((type) => (
                <div className='b-type' key={type.id}>
                  <span>{type.title}</span>
                  <small>{type.durationMinutes} min</small>
                </div>
              ))
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function VariantC({
  owner,
  bookingTypes,
  bookings,
  isLoading,
  isError,
}: WorkspaceProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <div className='ow-shell variant-c'>
      <Sidebar owner={owner} active='Booking Types' />
      <main className='ow-main c-main'>
        <header className='c-hero'>
          <div>
            <span className='ow-kicker'>Thursday, August 27</span>
            <h1>Good morning, {owner.name.split(' ')[0]}.</h1>
            <p>Here is what Guests can book and what is coming next.</p>
          </div>
          <button
            className='ow-primary-action'
            type='button'
            onClick={() => setSheetOpen(true)}
          >
            <Plus size={16} />
            New Booking Type
          </button>
        </header>
        {isError && <ErrorNotice />}
        <section className='c-types-section'>
          <header>
            <div>
              <h2>Booking Types</h2>
              <span>{bookingTypes.length} published</span>
            </div>
            <Link to='/guest'>
              View public page <ExternalLink size={13} />
            </Link>
          </header>
          <div className='c-type-strip'>
            {bookingTypes.length === 0 ? (
              <button className='c-add-type' onClick={() => setSheetOpen(true)}>
                <Plus size={20} />
                <span>Create your first Booking Type</span>
              </button>
            ) : (
              bookingTypes.map((type, index) => (
                <article className='c-type-card' key={type.id}>
                  <span className={`c-type-dot tone-${index % 3}`} />
                  <div>
                    <strong>{type.title}</strong>
                    <p>{type.description}</p>
                  </div>
                  <footer>
                    <span>
                      <Clock3 size={13} />
                      {type.durationMinutes} min
                    </span>
                    <MoreHorizontal size={15} />
                  </footer>
                </article>
              ))
            )}
          </div>
        </section>
        <section className='c-bookings-section'>
          <header>
            <div>
              <h2>Upcoming Bookings</h2>
              <span>Across all Booking Types</span>
            </div>
            <button className='ow-filter'>
              <ListFilter size={14} />
              Filter
            </button>
          </header>
          {isLoading ? (
            <div className='ow-loading'>Loading...</div>
          ) : bookings.length === 0 ? (
            <EmptyBookings compact />
          ) : (
            <div className='c-table'>
              <div className='c-table-head'>
                <span>Guest</span>
                <span>Booking Type</span>
                <span>Date and time</span>
                <span>Duration</span>
                <span />
              </div>
              {bookings.map((booking) => (
                <article key={booking.id}>
                  <div className='c-guest'>
                    <span className='ow-avatar'>
                      {initials(booking.guest.name)}
                    </span>
                    <span>
                      <strong>{booking.guest.name}</strong>
                      <small>{booking.guest.email}</small>
                    </span>
                  </div>
                  <strong>{booking.bookingType.title}</strong>
                  <span>
                    <strong>{formatBookingDate(booking)}</strong>
                    <small>{formatBookingTime(booking)}</small>
                  </span>
                  <span>{booking.bookingType.durationMinutes} min</span>
                  <button className='ow-icon-button'>
                    <MoreHorizontal size={16} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      {sheetOpen && <CreateSheet onClose={() => setSheetOpen(false)} />}
    </div>
  );
}

export function OwnerWorkspacePrototypePage() {
  const [searchParams] = useSearchParams();
  const requestedVariant = searchParams.get('variant')?.toUpperCase() ?? 'A';
  const variant = VARIANTS.some((item) => item.key === requestedVariant)
    ? requestedVariant
    : 'A';
  const requestedState = searchParams.get('state');
  const previewState: PreviewState =
    requestedState === 'empty' || requestedState === 'live'
      ? requestedState
      : 'populated';
  const profileQuery = useOwnerProfileQuery();
  const bookingTypesQuery = useOwnerBookingTypesQuery();
  const bookingsQuery = useOwnerUpcomingBookingsQuery();
  const liveTypes = bookingTypesQuery.data?.items ?? [];
  const liveBookings = bookingsQuery.data?.items ?? [];
  const props: WorkspaceProps = {
    owner:
      previewState === 'live'
        ? (profileQuery.data ?? fallbackOwner)
        : fallbackOwner,
    bookingTypes:
      previewState === 'empty'
        ? []
        : previewState === 'live'
          ? liveTypes
          : fallbackBookingTypes,
    bookings:
      previewState === 'empty'
        ? []
        : previewState === 'live'
          ? liveBookings
          : fallbackBookings,
    isLoading:
      previewState === 'live' &&
      (profileQuery.isLoading ||
        bookingTypesQuery.isLoading ||
        bookingsQuery.isLoading),
    isError:
      previewState === 'live' &&
      (profileQuery.isError ||
        bookingTypesQuery.isError ||
        bookingsQuery.isError),
  };

  return (
    <div className='owner-workspace-prototype'>
      {variant === 'A' && <VariantA {...props} />}
      {variant === 'B' && <VariantB {...props} />}
      {variant === 'C' && <VariantC {...props} />}
      <StateSelector current={previewState} />
      <PrototypeSwitcher variants={VARIANTS} current={variant} />
    </div>
  );
}
