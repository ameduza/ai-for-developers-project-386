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
const { OpenAPI } = await import('../lib/api/generated/index.js');
const { OwnerDashboardPage } =
  await import('../pages/owner/OwnerDashboardPage.js');

const bookingType = {
  id: 'consultation',
  title: 'Product strategy',
  description: 'Discuss the next product milestone.',
  durationMinutes: 30,
};

const upcomingBookings = {
  items: [
    {
      id: 'booking-1',
      bookingType,
      timeSlot: {
        id: 'slot-1',
        startTime: '2026-10-15T10:00:00Z',
        endTime: '2026-10-15T10:30:00Z',
        available: false,
      },
      guest: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      },
    },
    {
      id: 'booking-2',
      bookingType: {
        ...bookingType,
        id: 'pairing',
        title: 'Engineering pairing',
      },
      timeSlot: {
        id: 'slot-2',
        startTime: '2026-10-16T14:00:00Z',
        endTime: '2026-10-16T14:30:00Z',
        available: false,
      },
      guest: {
        name: 'Grace Hopper',
        email: 'grace@example.com',
      },
    },
  ],
};

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

function renderOwnerDashboard({
  bookingTypes = { items: [bookingType] },
  bookings = upcomingBookings,
}: {
  bookingTypes?: { items: (typeof bookingType)[] };
  bookings?: typeof upcomingBookings;
} = {}) {
  OpenAPI.BASE = 'http://127.0.0.1:4010';
  globalThis.fetch = async (input) => {
    const url = String(input);
    const body = url.endsWith('/owner')
      ? {
          id: 'owner-1',
          name: 'Alex Owner',
          bio: 'Booking Service owner',
        }
      : url.endsWith('/owner/booking-types')
        ? bookingTypes
        : url.endsWith('/owner/bookings')
          ? bookings
          : {};

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <OwnerDashboardPage />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe('OwnerDashboardPage', () => {
  it('gives /owner a dedicated dark workspace shell', async () => {
    const { appRoutes } = await import('../app/router.js');
    const router = createMemoryRouter(appRoutes, {
      initialEntries: ['/owner'],
    });

    OpenAPI.BASE = 'http://127.0.0.1:4010';
    globalThis.fetch = async (input) => {
      const url = String(input);
      const body = url.endsWith('/owner')
        ? {
            id: 'owner-1',
            name: 'Alex Owner',
            bio: 'Booking Service owner',
          }
        : { items: [] };

      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await waitFor(() => assert.ok(screen.getByText('Alex Owner')));

    assert.ok(screen.getByRole('complementary', { name: 'Owner workspace' }));
    assert.equal(
      screen
        .getByRole('link', { name: 'Booking Service' })
        .getAttribute('href'),
      '/owner',
    );
    assert.equal(
      screen
        .getByRole('link', { name: 'Guest workspace' })
        .getAttribute('href'),
      '/guest',
    );
    assert.ok(screen.getByText('Booking service'));
    assert.ok(screen.getByRole('link', { name: 'Booking types' }));
    assert.ok(screen.getByRole('link', { name: 'Bookings' }));
    assert.equal(document.documentElement.classList.contains('dark'), true);
    assert.equal(document.title, 'Owner workspace | Booking Service');

    router.dispose();
  });

  it('shows the populated three-column Booking service', async () => {
    renderOwnerDashboard();

    await waitFor(() => {
      assert.ok(screen.getByText('Engineering pairing'));
      assert.equal(screen.getAllByText('Product strategy').length, 2);
    });

    assert.ok(screen.getByRole('heading', { name: 'Create booking type' }));
    assert.ok(screen.getByRole('heading', { name: 'Upcoming bookings' }));
    assert.ok(
      screen.getByRole('complementary', { name: 'Published booking types' }),
    );
    assert.ok(screen.getByRole('heading', { name: 'Engineering pairing' }));
    assert.ok(screen.getByText('Grace Hopper'));
    assert.ok(screen.getByRole('link', { name: 'grace@example.com' }));
    assert.ok(screen.getByText('October 15, 2026 · 10:00 AM–10:30 AM UTC'));
    assert.ok(screen.getByText('October 16, 2026 · 2:00 PM–2:30 PM UTC'));
    assert.equal(screen.getAllByText('30 min').length >= 2, true);
  });

  it('keeps creation usable when the Owner has no published types or bookings', async () => {
    renderOwnerDashboard({
      bookingTypes: { items: [] },
      bookings: { items: [] },
    });

    await waitFor(() => assert.ok(screen.getByText('Alex Owner')));

    assert.ok(screen.getByText('No upcoming bookings.'));
    assert.ok(screen.getByText('No booking types yet.'));
    assert.ok(screen.getByText('0'));
    assert.equal(
      screen
        .getByRole('button', { name: 'Create booking type' })
        .hasAttribute('disabled'),
      false,
    );
  });

  it('lets the Owner retry each failed workspace request', async () => {
    const requests: string[] = [];
    globalThis.fetch = async (input) => {
      requests.push(String(input));
      return new Response(JSON.stringify({ message: 'upstream failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <OwnerDashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      assert.ok(
        screen.getByText('We couldn’t load the Owner information. Try again.'),
      );
    });

    assert.ok(
      screen.getByText('We couldn’t load the booking types. Try again.'),
    );
    assert.ok(
      screen.getByText('We couldn’t load upcoming bookings. Try again.'),
    );
    assert.equal(
      screen.getAllByRole('button', { name: 'Try again' }).length,
      3,
    );

    const requestCount = requests.length;
    screen.getAllByRole('button', { name: 'Try again' })[0]?.click();
    await waitFor(() => assert.ok(requests.length > requestCount));
  });

  it('guides and validates Booking Type creation with the copy contract', async () => {
    renderOwnerDashboard({
      bookingTypes: { items: [] },
      bookings: { items: [] },
    });

    assert.ok(screen.getByText('3–100 characters'));
    assert.ok(screen.getByText('10–500 characters'));
    assert.ok(screen.getByText('15–480 whole minutes'));

    fireEvent.change(screen.getByLabelText('Duration'), {
      target: { value: '' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Create booking type' }),
    );

    await waitFor(() => assert.ok(screen.getByText('Enter a title')));
    assert.ok(screen.getByText('Enter a description'));
    assert.ok(screen.getByText('Enter a duration in whole minutes'));
  });

  it('creates a Booking Type and refreshes the published index', async () => {
    const createdBookingType = {
      id: 'portfolio-review',
      title: 'Portfolio review',
      description: 'A focused review of your portfolio and next steps.',
      durationMinutes: 45,
    };
    let bookingTypes: (typeof bookingType)[] = [];
    let resolveCreation!: (response: Response) => void;
    const creationResponse = new Promise<Response>((resolve) => {
      resolveCreation = resolve;
    });
    const requests: Array<{ method?: string; body?: string }> = [];

    globalThis.fetch = async (input, init) => {
      requests.push({
        method: init?.method,
        body: typeof init?.body === 'string' ? init.body : undefined,
      });
      const url = String(input);

      if (init?.method === 'POST') return creationResponse;
      if (url.endsWith('/owner')) {
        return new Response(
          JSON.stringify({
            id: 'owner-1',
            name: 'Alex Owner',
            bio: 'Booking Service owner',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const body = url.endsWith('/owner/booking-types')
        ? { items: bookingTypes }
        : { items: [] };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <OwnerDashboardPage />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: createdBookingType.title },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: createdBookingType.description },
    });
    fireEvent.change(screen.getByLabelText('Duration'), {
      target: { value: '45' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Create booking type' }),
    );

    await waitFor(() => {
      assert.ok(screen.getByRole('button', { name: 'Loading...' }));
    });
    assert.equal(
      screen
        .getByRole('button', { name: 'Loading...' })
        .hasAttribute('disabled'),
      true,
    );

    bookingTypes = [createdBookingType];
    resolveCreation(
      new Response(JSON.stringify(createdBookingType), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await waitFor(() => assert.ok(screen.getByText('Booking type created')));
    assert.ok(screen.getByRole('heading', { name: 'Portfolio review' }));
    assert.equal(
      (screen.getByLabelText('Title') as HTMLInputElement).value,
      '',
    );

    const post = requests.find((request) => request.method === 'POST');
    assert.deepEqual(JSON.parse(post?.body ?? '{}'), {
      title: 'Portfolio review',
      description: 'A focused review of your portfolio and next steps.',
      durationMinutes: 45,
    });
  });

  it('keeps creation available after an API error', async () => {
    globalThis.fetch = async (input, init) => {
      if (init?.method === 'POST') {
        return new Response(JSON.stringify({ message: 'upstream failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const url = String(input);
      const body = url.endsWith('/owner')
        ? {
            id: 'owner-1',
            name: 'Alex Owner',
            bio: 'Booking Service owner',
          }
        : { items: [] };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <OwnerDashboardPage />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Portfolio review' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'A focused review of your portfolio and next steps.' },
    });
    fireEvent.change(screen.getByLabelText('Duration'), {
      target: { value: '45' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Create booking type' }),
    );

    await waitFor(() => {
      assert.ok(
        screen.getByText('We couldn’t create the booking type. Try again.'),
      );
    });
    assert.equal(
      screen
        .getByRole('button', { name: 'Create booking type' })
        .hasAttribute('disabled'),
      false,
    );
  });
});
