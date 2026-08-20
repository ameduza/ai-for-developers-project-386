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

const { render, screen, cleanup, waitFor, fireEvent } = await import(
  "@testing-library/react"
);
const { QueryClient, QueryClientProvider } = await import(
  "@tanstack/react-query"
);
const { createMemoryRouter, RouterProvider } = await import("react-router-dom");
const { BookingForm } = await import("../features/guest/BookingForm.js");

const timeSlot = {
  id: "slot-1",
  startTime: "2026-10-15T10:00:00Z",
  endTime: "2026-10-15T10:30:00Z",
  available: true,
};

const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];

function stubFetch(status: number, body: unknown) {
  fetchCalls.length = 0;
  globalThis.fetch = async (input, init) => {
    fetchCalls.push({ url: String(input), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
}

afterEach(() => {
  cleanup();
  fetchCalls.length = 0;
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}

function renderBookingForm() {
  const router = createMemoryRouter(
    [
      {
        path: "/guest/booking-types/:bookingTypeId",
        element: <BookingForm bookingTypeId="consultation" timeSlot={timeSlot} />,
      },
      {
        path: "/bookings/:bookingId",
        element: <p>Booking confirmation reached</p>,
      },
    ],
    { initialEntries: ["/guest/booking-types/consultation"] },
  );

  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

function fillGuestDetails() {
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Ada Lovelace" },
  });
  fireEvent.change(screen.getByLabelText("Your email"), {
    target: { value: "ada@example.com" },
  });
}

function submitForm() {
  fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));
}

describe("BookingForm", () => {
  it("requires guest details before any request is sent", async () => {
    renderBookingForm();

    submitForm();

    await waitFor(() => {
      assert.ok(screen.getByText("Name is required"));
    });
    assert.ok(screen.getByText("Email is required"));
    assert.equal(fetchCalls.length, 0);
  });

  it("creates the booking and lands on its confirmation page", async () => {
    stubFetch(201, {
      id: "booking-1",
      bookingType: {
        id: "consultation",
        title: "Product strategy",
        description: "Discuss the next product milestone.",
        durationMinutes: 30,
      },
      timeSlot,
      guest: { name: "Ada Lovelace", email: "ada@example.com" },
    });
    renderBookingForm();

    fillGuestDetails();
    submitForm();

    await waitFor(() => {
      assert.ok(screen.getByText("Booking confirmation reached"));
    });

    const post = fetchCalls.find((call) => call.url.endsWith("/bookings"));
    assert.ok(post, "Expected a POST request to /bookings");
    assert.equal(post.init?.method, "POST");
    assert.deepEqual(JSON.parse(String(post.init?.body)), {
      eventTypeId: "consultation",
      slotStart: "2026-10-15T10:00:00Z",
      slotEnd: "2026-10-15T10:30:00Z",
      guestName: "Ada Lovelace",
      guestEmail: "ada@example.com",
    });
  });

  it("surfaces a 400 validation response as an inline field error", async () => {
    stubFetch(400, {
      code: "validation_error",
      message: "guestEmail must be a valid email address",
    });
    renderBookingForm();

    fillGuestDetails();
    submitForm();

    await waitFor(() => {
      assert.ok(
        screen.getByText("guestEmail must be a valid email address"),
      );
    });
    assert.equal(
      (screen.getByLabelText("Your email") as HTMLInputElement).value,
      "ada@example.com",
    );
    assert.equal(screen.queryByText("Booking confirmation reached"), null);
  });

  it("keeps guest details and shows an availability message on 409", async () => {
    stubFetch(409, {
      code: "slot_taken",
      message: "Time slot is no longer available",
    });
    renderBookingForm();

    fillGuestDetails();
    submitForm();

    await waitFor(() => {
      assert.ok(screen.getByText(/no longer available/i));
    });
    assert.equal(
      (screen.getByLabelText("Your name") as HTMLInputElement).value,
      "Ada Lovelace",
    );
    assert.equal(
      (screen.getByLabelText("Your email") as HTMLInputElement).value,
      "ada@example.com",
    );
    assert.equal(screen.queryByText("Booking confirmation reached"), null);
  });

  it("shows an inline error when the request fails without a response", async () => {
    fetchCalls.length = 0;
    globalThis.fetch = async () => {
      throw new TypeError("Network request failed");
    };
    renderBookingForm();

    fillGuestDetails();
    submitForm();

    await waitFor(() => {
      assert.ok(
        screen.getByText("Could not create the booking. Please try again."),
      );
    });
    assert.equal(screen.queryByText("Booking confirmation reached"), null);
  });
});
