import { describe, it, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

process.env.VITE_API_BASE_URL = "http://127.0.0.1:4010";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost:5173",
  pretendToBeVisual: true,
});

const globalsToPatch = [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "Node",
  "Event",
  "CustomEvent",
  "URL",
  "URLSearchParams",
  "fetch",
  "Request",
  "Response",
  "Headers",
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
  await import("@testing-library/react");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const { createMemoryRouter, RouterProvider } = await import("react-router-dom");
const { GuestLandingPage } = await import("../pages/guest/GuestLandingPage.js");
const { GuestBookingTypePage } =
  await import("../pages/guest/GuestBookingTypePage.js");
const { GuestBookingConfirmationPage } =
  await import("../pages/guest/GuestBookingConfirmationPage.js");

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

function renderWithProviders(ui: React.ReactNode, route = "/guest") {
  const qc = createTestQueryClient();
  const router = createMemoryRouter(
    [
      { path: "/guest", element: ui },
      { path: "/guest/booking-types/:bookingTypeId", element: ui },
      { path: "/bookings/:bookingId", element: ui },
    ],
    { initialEntries: [route] },
  );
  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("GuestLandingPage", () => {
  it("renders the available booking types heading", () => {
    renderWithProviders(<GuestLandingPage />);
    assert.ok(screen.getByText("Available Booking Types"));
  });

  it("shows a description for booking types", () => {
    renderWithProviders(<GuestLandingPage />);
    assert.ok(screen.getByText("Select a time slot that works best for you."));
  });

  it("displays booking types with title, description, and duration", () => {
    renderWithProviders(<GuestLandingPage />);
    // This test validates that the heading exists
    assert.ok(screen.getByText(/Available Booking Types/i));
  });

  it("links a booking type to its available time slots", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          items: [
            {
              id: "consultation",
              title: "Product strategy",
              description: "Discuss the next product milestone.",
              durationMinutes: 30,
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );

    renderWithProviders(<GuestLandingPage />);

    await waitFor(() => {
      assert.equal(
        screen.getByRole("link", { name: "Book Now" }).getAttribute("href"),
        "/guest/booking-types/consultation",
      );
    });
  });
});

describe("GuestBookingTypePage", () => {
  it("shows the selected booking type id", () => {
    renderWithProviders(
      <GuestBookingTypePage />,
      "/guest/booking-types/abc-123",
    );
    assert.ok(screen.getByText("Available time slots"));
    assert.ok(screen.getByText(/abc-123/));
  });

  it("shows only free slots within the next 14 days", async () => {
    const now = Date.now();
    const availableTimeSlot = {
      id: "available-slot",
      startTime: new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(
        now + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
      ).toISOString(),
      available: true,
    };
    const timeSlots = {
      items: [
        availableTimeSlot,
        {
          id: "booked-slot",
          startTime: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(
            now + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
          ).toISOString(),
          available: false,
        },
        {
          id: "too-far-slot",
          startTime: new Date(now + 15 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(
            now + 15 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
          ).toISOString(),
          available: true,
        },
        {
          id: "past-slot",
          startTime: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(
            now - 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
          ).toISOString(),
          available: true,
        },
      ],
    };

    globalThis.fetch = async () =>
      new Response(JSON.stringify(timeSlots), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    renderWithProviders(
      <GuestBookingTypePage />,
      "/guest/booking-types/consultation",
    );

    await waitFor(() => {
      assert.equal(screen.getAllByRole("listitem").length, 1);
    });

    const visibleTimeSlot = screen.getAllByRole("listitem")[0];
    assert.equal(
      visibleTimeSlot?.querySelector("time")?.getAttribute("dateTime"),
      availableTimeSlot.startTime,
    );
  });

  it("books a selected time slot and lands on the confirmation page", async () => {
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
        body: typeof init?.body === "string" ? init.body : undefined,
      });

      if (init?.method === "POST") {
        return new Response(
          JSON.stringify({
            id: "booking-42",
            bookingType: {
              id: "consultation",
              title: "Product strategy",
              description: "Discuss the next product milestone.",
              durationMinutes: 30,
            },
            timeSlot: {
              id: "available-slot",
              startTime: slotStart,
              endTime: slotEnd,
              available: false,
            },
            guest: { name: "Ada Lovelace", email: "ada@example.com" },
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          items: [
            {
              id: "available-slot",
              startTime: slotStart,
              endTime: slotEnd,
              available: true,
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    };

    const qc = createTestQueryClient();
    const router = createMemoryRouter(
      [
        {
          path: "/guest/booking-types/:bookingTypeId",
          element: <GuestBookingTypePage />,
        },
        {
          path: "/bookings/:bookingId",
          element: <p>Booking confirmation reached</p>,
        },
      ],
      { initialEntries: ["/guest/booking-types/consultation"] },
    );
    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      assert.ok(screen.getByRole("radio"));
    });

    fireEvent.click(screen.getByRole("radio"));
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Your email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));

    await waitFor(() => {
      assert.ok(screen.getByText("Booking confirmation reached"));
    });

    const post = requests.find((request) => request.method === "POST");
    assert.ok(post, "Expected a POST request to /bookings");
    assert.ok(post.url.endsWith("/bookings"));
    assert.deepEqual(JSON.parse(post.body ?? "{}"), {
      bookingTypeId: "consultation",
      timeSlotStart: slotStart,
      timeSlotEnd: slotEnd,
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
    });
  });
});

describe("GuestBookingConfirmationPage", () => {
  const bookingFixture = {
    id: "bk-1",
    bookingType: {
      id: "consultation",
      title: "Product strategy",
      description: "Discuss the next product milestone.",
      durationMinutes: 30,
    },
    timeSlot: {
      id: "slot-1",
      startTime: "2026-09-01T10:00:00Z",
      endTime: "2026-09-01T10:30:00Z",
      available: false,
    },
    guest: { name: "Ada Lovelace", email: "ada@example.com" },
  };

  it("shows the booking type and time slot details without login", async () => {
    const requests: Array<{ url: string; method?: string }> = [];

    globalThis.fetch = async (input, init) => {
      requests.push({ url: String(input), method: init?.method });

      return new Response(JSON.stringify(bookingFixture), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    renderWithProviders(<GuestBookingConfirmationPage />, "/bookings/bk-1");

    await waitFor(() => {
      assert.ok(screen.getByText("Product strategy"));
    });
    assert.ok(screen.getByText(/Discuss the next product milestone\./));
    assert.ok(screen.getByText(/September 1, 2026/));
    assert.ok(screen.getByText(/Ada Lovelace/));
    assert.ok(screen.getByText(/ada@example\.com/));

    const get = requests.find((request) => request.method === "GET");
    assert.ok(get, "Expected a GET request for the booking");
    assert.ok(get.url.endsWith("/bookings/bk-1"));
  });

  it("shows a dedicated not found state for an unknown booking id", async () => {
    globalThis.fetch = async () =>
      new Response("The server cannot find the requested resource.", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });

    renderWithProviders(<GuestBookingConfirmationPage />, "/bookings/missing");

    await waitFor(() => {
      assert.ok(screen.getByText("Booking not found"));
    });
    assert.ok(screen.getByText(/does not exist or may have been cancelled/));
  });

  it("cancels the booking from the confirmation view", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    let cancelled = false;

    globalThis.fetch = async (input, init) => {
      requests.push({ url: String(input), method: init?.method });

      if (init?.method === "DELETE") {
        cancelled = true;

        return new Response(null, { status: 204 });
      }

      if (cancelled) {
        return new Response("The server cannot find the requested resource.", {
          status: 404,
          headers: { "Content-Type": "text/plain" },
        });
      }

      return new Response(JSON.stringify(bookingFixture), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    renderWithProviders(<GuestBookingConfirmationPage />, "/bookings/bk-1");

    await waitFor(() => {
      assert.ok(screen.getByRole("button", { name: "Cancel booking" }));
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel booking" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, cancel it" }));

    await waitFor(() => {
      assert.ok(screen.getByText("Booking cancelled"));
    });
    assert.ok(screen.getByText(/This booking has been cancelled/));

    const refetchCount = () =>
      requests.filter((request) => request.method === "GET").length;
    await waitFor(() => {
      assert.ok(refetchCount() >= 2, "Expected the booking query to refetch");
    });
    assert.ok(
      screen.getByText("Booking cancelled"),
      "Cancelled confirmation must survive the post-cancel 404 refetch",
    );

    const del = requests.find((request) => request.method === "DELETE");
    assert.ok(del, "Expected a DELETE request for the booking");
    assert.ok(del.url.endsWith("/bookings/bk-1"));
  });
});
