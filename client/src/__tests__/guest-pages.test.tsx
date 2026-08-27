import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

process.env.VITE_API_BASE_URL = 'http://127.0.0.1:4010';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:5173',
  pretendToBeVisual: true,
});

const globalsToPatch = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Node',
  'Event',
  'CustomEvent',
  'URL',
  'URLSearchParams',
  'fetch',
  'Request',
  'Response',
  'Headers',
] as const;

const originals: Record<string, unknown> = {};

before(() => {
  for (const key of globalsToPatch) {
    originals[key] = globalThis[key];
    Object.defineProperty(globalThis, key, {
      value: (dom.window as Record<string, unknown>)[key] ?? originals[key],
      writable: true,
      configurable: true,
    });
  }
});

after(() => {
  for (const key of globalsToPatch) {
    Object.defineProperty(globalThis, key, {
      value: originals[key],
      writable: true,
      configurable: true,
    });
  }
});

const { render, screen, cleanup, waitFor, fireEvent } =
  await import('@testing-library/react');
const { QueryClient, QueryClientProvider } =
  await import('@tanstack/react-query');
const { createMemoryRouter, RouterProvider } = await import('react-router-dom');
const { GuestLandingPage } = await import('../pages/guest/GuestLandingPage.js');
const { GuestBookingTypePage } =
  await import('../pages/guest/GuestBookingTypePage.js');
const { GuestBookingConfirmationPage } =
  await import('../pages/guest/GuestBookingConfirmationPage.js');
const { HomePage } = await import('../pages/HomePage.js');
const { ShellLayout } = await import('../app/layouts/ShellLayout.js');

afterEach(() => {
  cleanup();
  globalThis.fetch = (dom.window as Record<string, typeof fetch>).fetch;
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactNode, route = '/guest') {
  const qc = createTestQueryClient();
  const router = createMemoryRouter(
    [
      { path: '/guest', element: ui },
      { path: '/guest/booking-types/:bookingTypeId', element: ui },
      { path: '/bookings/:bookingId', element: ui },
    ],
    { initialEntries: [route] },
  );
  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('public booking shell', () => {
  it('connects the informational landing page to the Guest journey', () => {
    const router = createMemoryRouter(
      [
        {
          element: <ShellLayout />,
          children: [{ path: '/', element: <HomePage /> }],
        },
      ],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={router} />);

    assert.equal(
      screen
        .getByRole('link', { name: 'Booking Service' })
        .getAttribute('href'),
      '/',
    );
    assert.equal(
      screen
        .getByRole('link', { name: 'Owner workspace' })
        .getAttribute('href'),
      '/owner',
    );
    assert.ok(
      screen.getByRole('heading', {
        name: 'Find a time that works for you',
      }),
    );
    assert.ok(
      screen.getByText(
        'Choose a booking type, select an available time, and confirm your booking.',
      ),
    );
    assert.equal(
      screen.getByRole('link', { name: 'Book time slot' }).getAttribute('href'),
      '/guest',
    );
    assert.equal(screen.queryByText(/scaffold/i), null);
    assert.equal(screen.queryByText('Guest area'), null);
    assert.equal(screen.queryByText('Owner area'), null);
  });
});

describe('GuestLandingPage', () => {
  it('presents the editorial booking type catalog', async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          items: [
            {
              id: 'consultation',
              title: 'Product strategy',
              description: 'Discuss the next product milestone.',
              durationMinutes: 30,
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );

    renderWithProviders(<GuestLandingPage />);

    await waitFor(() => {
      assert.ok(screen.getByRole('heading', { name: 'Choose a booking type' }));
      assert.equal(screen.getAllByText('01').length, 2);
      assert.ok(screen.getByText('Product strategy'));
      assert.ok(screen.getByText('Discuss the next product milestone.'));
      assert.ok(screen.getByText('30 min'));
      assert.equal(
        screen
          .getByRole('link', { name: 'View available times' })
          .getAttribute('href'),
        '/guest/booking-types/consultation',
      );
    });
    assert.equal(document.title, 'Choose a booking type | Booking Service');
  });

  it('recovers from a booking type load failure', async () => {
    let attempts = 0;
    globalThis.fetch = async () => {
      attempts += 1;

      if (attempts === 1) {
        return new Response('Unavailable', { status: 503 });
      }

      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    renderWithProviders(<GuestLandingPage />);

    await waitFor(() => {
      assert.ok(
        screen.getByText('We couldn’t load the booking types. Try again.'),
      );
    });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      assert.ok(screen.getByText('No booking types are available right now.'));
    });
    assert.equal(attempts, 2);
  });
});

describe('GuestBookingTypePage', () => {
  it('moves from calendar and free time selection to guest details', async () => {
    const slotStart = '2026-09-01T10:00:00Z';
    const slotEnd = '2026-09-01T10:30:00Z';

    globalThis.fetch = async (input) => {
      const url = String(input);

      if (url.endsWith('/booking-types')) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: 'consultation',
                title: 'Product strategy',
                description: 'Discuss the next product milestone.',
                durationMinutes: 30,
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(
        JSON.stringify({
          items: [
            {
              id: 'available-slot',
              startTime: slotStart,
              endTime: slotEnd,
              available: true,
            },
            {
              id: 'occupied-slot',
              startTime: '2026-09-01T11:00:00Z',
              endTime: '2026-09-01T11:30:00Z',
              available: false,
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    };

    renderWithProviders(
      <GuestBookingTypePage />,
      '/guest/booking-types/consultation',
    );

    await waitFor(() => {
      assert.ok(screen.getByRole('heading', { name: 'Choose a time' }));
      assert.ok(screen.getByText('Product strategy'));
      assert.ok(screen.getByText('30 min'));
    });
    assert.equal(screen.queryByText('consultation'), null);
    assert.equal(
      screen.getByRole('button', { name: 'Continue' }).hasAttribute('disabled'),
      true,
    );

    fireEvent.click(screen.getByRole('button', { name: 'September 1, 2026' }));
    assert.equal(screen.queryByText(/11:00 AM/), null);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'September 1, 2026 · 10:00 AM–10:30 AM UTC',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    assert.ok(screen.getByRole('heading', { name: 'Enter your details' }));
    assert.ok(screen.getByText('Product strategy'));
    assert.equal(
      screen.getAllByText('September 1, 2026 · 10:00 AM–10:30 AM UTC').length,
      1,
    );
  });

  it('books a selected time slot and lands on the confirmation page', async () => {
    const now = Date.now();
    const slotStart = new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString();
    const slotEnd = new Date(
      now + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
    ).toISOString();
    const requests: Array<{ url: string; method?: string; body?: string }> = [];

    globalThis.fetch = async (input, init) => {
      requests.push({
        url: String(input),
        method: init?.method,
        body: typeof init?.body === 'string' ? init.body : undefined,
      });

      if (init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            id: 'booking-42',
            bookingType: {
              id: 'consultation',
              title: 'Product strategy',
              description: 'Discuss the next product milestone.',
              durationMinutes: 30,
            },
            timeSlot: {
              id: 'available-slot',
              startTime: slotStart,
              endTime: slotEnd,
              available: false,
            },
            guest: { name: 'Ada Lovelace', email: 'ada@example.com' },
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (String(input).endsWith('/booking-types')) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: 'consultation',
                title: 'Product strategy',
                description: 'Discuss the next product milestone.',
                durationMinutes: 30,
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(
        JSON.stringify({
          items: [
            {
              id: 'available-slot',
              startTime: slotStart,
              endTime: slotEnd,
              available: true,
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    };

    const qc = createTestQueryClient();
    const router = createMemoryRouter(
      [
        {
          path: '/guest/booking-types/:bookingTypeId',
          element: <GuestBookingTypePage />,
        },
        {
          path: '/bookings/:bookingId',
          element: <p>Booking confirmation reached</p>,
        },
      ],
      { initialEntries: ['/guest/booking-types/consultation'] },
    );
    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      assert.ok(screen.getByRole('button', { name: /UTC$/ }));
    });

    fireEvent.click(screen.getByRole('button', { name: /UTC$/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    await waitFor(() => {
      assert.ok(screen.getByText('Booking confirmation reached'));
    });

    const post = requests.find((request) => request.method === 'POST');
    assert.ok(post, 'Expected a POST request to /bookings');
    assert.ok(post.url.endsWith('/bookings'));
    assert.deepEqual(JSON.parse(post.body ?? '{}'), {
      bookingTypeId: 'consultation',
      timeSlotStart: slotStart,
      timeSlotEnd: slotEnd,
      guestName: 'Ada Lovelace',
      guestEmail: 'ada@example.com',
    });
  });

  it('returns to time selection after a conflict and preserves guest details', async () => {
    let slotRequests = 0;
    const slots = [
      {
        id: 'first-slot',
        startTime: '2026-09-01T10:00:00Z',
        endTime: '2026-09-01T10:30:00Z',
        available: true,
      },
      {
        id: 'second-slot',
        startTime: '2026-09-01T11:00:00Z',
        endTime: '2026-09-01T11:30:00Z',
        available: true,
      },
    ];

    globalThis.fetch = async (input, init) => {
      if (init?.method === 'POST') {
        return new Response(
          JSON.stringify({
            code: 'slot_taken',
            message: 'Internal server wording must not be exposed',
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (String(input).endsWith('/booking-types')) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: 'consultation',
                title: 'Product strategy',
                description: 'Discuss the next product milestone.',
                durationMinutes: 30,
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      slotRequests += 1;
      return new Response(JSON.stringify({ items: slots }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    renderWithProviders(
      <GuestBookingTypePage />,
      '/guest/booking-types/consultation',
    );

    await waitFor(() => {
      assert.ok(
        screen.getByRole('button', {
          name: 'September 1, 2026 · 10:00 AM–10:30 AM UTC',
        }),
      );
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'September 1, 2026 · 10:00 AM–10:30 AM UTC',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Ada Lovelace' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm booking' }));

    await waitFor(() => {
      assert.ok(
        screen.getByText(
          'This time is no longer available. Choose another time.',
        ),
      );
    });
    const timeHeading = screen.getByRole('heading', { name: 'Choose a time' });
    assert.equal(document.activeElement, timeHeading);
    await waitFor(() => {
      assert.equal(slotRequests, 2);
      assert.equal(
        screen.queryByRole('button', {
          name: 'September 1, 2026 · 10:00 AM–10:30 AM UTC',
        }),
        null,
      );
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'September 1, 2026 · 11:00 AM–11:30 AM UTC',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    assert.equal(
      (screen.getByLabelText('Name') as HTMLInputElement).value,
      'Ada Lovelace',
    );
    assert.equal(
      (screen.getByLabelText('Email') as HTMLInputElement).value,
      'ada@example.com',
    );
  });

  it('offers another booking type when no free times remain', async () => {
    globalThis.fetch = async (input) =>
      new Response(
        JSON.stringify(
          String(input).endsWith('/booking-types')
            ? {
                items: [
                  {
                    id: 'consultation',
                    title: 'Product strategy',
                    description: 'Discuss the next product milestone.',
                    durationMinutes: 30,
                  },
                ],
              }
            : { items: [] },
        ),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );

    renderWithProviders(
      <GuestBookingTypePage />,
      '/guest/booking-types/consultation',
    );

    await waitFor(() => {
      assert.ok(
        screen.getByText('No times are available in the next 14 days.'),
      );
    });
    assert.equal(
      screen
        .getByRole('link', { name: 'Choose another booking type' })
        .getAttribute('href'),
      '/guest',
    );
  });

  it('recovers from an available times load failure', async () => {
    let slotAttempts = 0;
    globalThis.fetch = async (input) => {
      if (String(input).endsWith('/booking-types')) {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: 'consultation',
                title: 'Product strategy',
                description: 'Discuss the next product milestone.',
                durationMinutes: 30,
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      slotAttempts += 1;
      return slotAttempts === 1
        ? new Response('Unavailable', { status: 503 })
        : new Response(JSON.stringify({ items: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
    };

    renderWithProviders(
      <GuestBookingTypePage />,
      '/guest/booking-types/consultation',
    );

    await waitFor(() => {
      assert.ok(
        screen.getByText('We couldn’t load the available times. Try again.'),
      );
    });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => {
      assert.ok(
        screen.getByText('No times are available in the next 14 days.'),
      );
    });
    assert.equal(slotAttempts, 2);
  });

  it('offers a retry action when the booking type is unavailable', async () => {
    let bookingTypeAttempts = 0;
    globalThis.fetch = async (input) => {
      if (String(input).endsWith('/booking-types')) {
        bookingTypeAttempts += 1;
        return new Response(
          JSON.stringify({
            items:
              bookingTypeAttempts === 1
                ? []
                : [
                    {
                      id: 'consultation',
                      title: 'Product strategy',
                      description: 'Discuss the next product milestone.',
                      durationMinutes: 30,
                    },
                  ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    renderWithProviders(
      <GuestBookingTypePage />,
      '/guest/booking-types/consultation',
    );

    await waitFor(() => {
      assert.ok(
        screen.getByText('We couldn’t load the available times. Try again.'),
      );
    });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      assert.ok(
        screen.getByText('No times are available in the next 14 days.'),
      );
    });
    assert.equal(bookingTypeAttempts, 2);
  });
});

describe('GuestBookingConfirmationPage', () => {
  const bookingFixture = {
    id: 'bk-1',
    bookingType: {
      id: 'consultation',
      title: 'Product strategy',
      description: 'Discuss the next product milestone.',
      durationMinutes: 30,
    },
    timeSlot: {
      id: 'slot-1',
      startTime: '2026-09-01T10:00:00Z',
      endTime: '2026-09-01T10:30:00Z',
      available: false,
    },
    guest: { name: 'Ada Lovelace', email: 'ada@example.com' },
  };

  it('shows the booking type and time slot details without login', async () => {
    const requests: Array<{ url: string; method?: string }> = [];

    globalThis.fetch = async (input, init) => {
      requests.push({ url: String(input), method: init?.method });

      return new Response(JSON.stringify(bookingFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    renderWithProviders(<GuestBookingConfirmationPage />, '/bookings/bk-1');

    await waitFor(() => {
      assert.ok(screen.getByRole('heading', { name: 'Booking confirmed' }));
    });
    assert.ok(screen.getByText('Name'));
    assert.ok(screen.getByText('Ada Lovelace'));
    assert.ok(screen.getByText('Email'));
    assert.ok(screen.getByText('ada@example.com'));
    assert.ok(screen.getByText('Booking type'));
    assert.equal(screen.getAllByText('Product strategy').length, 2);
    assert.ok(screen.getByText('Time'));
    assert.ok(screen.getByText('September 1, 2026 · 10:00 AM–10:30 AM UTC'));
    assert.equal(
      screen
        .getByRole('link', { name: 'Book another time' })
        .getAttribute('href'),
      '/guest',
    );

    const get = requests.find((request) => request.method === 'GET');
    assert.ok(get, 'Expected a GET request for the booking');
    assert.ok(get.url.endsWith('/bookings/bk-1'));
  });

  it('shows a dedicated not found state for an unknown booking id', async () => {
    globalThis.fetch = async () =>
      new Response('The server cannot find the requested resource.', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });

    renderWithProviders(<GuestBookingConfirmationPage />, '/bookings/missing');

    await waitFor(() => {
      assert.ok(screen.getByText('Booking not found'));
    });
    assert.ok(
      screen.getByText(
        'This link may be invalid, or the booking may have been canceled.',
      ),
    );
    assert.equal(
      screen
        .getByRole('link', { name: 'Go to booking page' })
        .getAttribute('href'),
      '/guest',
    );
  });

  it('recovers from a booking load failure', async () => {
    let attempts = 0;
    globalThis.fetch = async () => {
      attempts += 1;
      return attempts === 1
        ? new Response('Unavailable', { status: 503 })
        : new Response(JSON.stringify(bookingFixture), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
    };

    renderWithProviders(<GuestBookingConfirmationPage />, '/bookings/bk-1');

    await waitFor(() => {
      assert.ok(screen.getByText('We couldn’t load this booking. Try again.'));
    });
    assert.ok(screen.getByRole('link', { name: 'Go to booking page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => {
      assert.ok(screen.getByRole('heading', { name: 'Booking confirmed' }));
    });
    assert.equal(attempts, 2);
  });

  it('cancels the booking from the confirmation view', async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    let cancelled = false;

    globalThis.fetch = async (input, init) => {
      requests.push({ url: String(input), method: init?.method });

      if (init?.method === 'DELETE') {
        cancelled = true;

        return new Response(null, { status: 204 });
      }

      if (cancelled) {
        return new Response('The server cannot find the requested resource.', {
          status: 404,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      return new Response(JSON.stringify(bookingFixture), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    renderWithProviders(<GuestBookingConfirmationPage />, '/bookings/bk-1');

    await waitFor(() => {
      assert.ok(screen.getByRole('button', { name: 'Cancel booking' }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel booking' }));
    assert.ok(screen.getByRole('heading', { name: 'Cancel this booking?' }));
    assert.ok(
      screen.getByText('This time will become available for someone else.'),
    );
    assert.ok(screen.getByRole('button', { name: 'Keep booking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel booking' }));

    await waitFor(() => {
      assert.ok(screen.getByRole('heading', { name: 'Booking canceled' }));
    });
    assert.ok(
      screen.getByText(
        'Your booking has been canceled. This time is now available for someone else.',
      ),
    );
    assert.ok(screen.getByRole('link', { name: 'Book another time' }));

    const refetchCount = () =>
      requests.filter((request) => request.method === 'GET').length;
    await waitFor(() => {
      assert.ok(refetchCount() >= 2, 'Expected the booking query to refetch');
    });
    assert.ok(
      screen.getByText('Booking canceled'),
      'Canceled confirmation must survive the post-cancel 404 refetch',
    );

    const del = requests.find((request) => request.method === 'DELETE');
    assert.ok(del, 'Expected a DELETE request for the booking');
    assert.ok(del.url.endsWith('/bookings/bk-1'));
  });
});
