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

const { render, screen, cleanup, waitFor } =
  await import("@testing-library/react");
const { QueryClient, QueryClientProvider } =
  await import("@tanstack/react-query");
const { OpenAPI } = await import("../lib/api/generated/index.js");
const { OwnerDashboardPage } =
  await import("../pages/owner/OwnerDashboardPage.js");

const bookingType = {
  id: "consultation",
  title: "Product strategy",
  description: "Discuss the next product milestone.",
  durationMinutes: 30,
};

const upcomingBookings = {
  items: [
    {
      id: "booking-1",
      bookingType,
      timeSlot: {
        id: "slot-1",
        startTime: "2026-10-15T10:00:00Z",
        endTime: "2026-10-15T10:30:00Z",
        available: false,
      },
      guest: {
        name: "Ada Lovelace",
        email: "ada@example.com",
      },
    },
    {
      id: "booking-2",
      bookingType: {
        ...bookingType,
        id: "pairing",
        title: "Engineering pairing",
      },
      timeSlot: {
        id: "slot-2",
        startTime: "2026-10-16T14:00:00Z",
        endTime: "2026-10-16T14:30:00Z",
        available: false,
      },
      guest: {
        name: "Grace Hopper",
        email: "grace@example.com",
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
    },
  });
}

function renderOwnerDashboard() {
  OpenAPI.BASE = "http://127.0.0.1:4010";
  globalThis.fetch = async (input) => {
    const url = String(input);
    const body = url.endsWith("/owner")
      ? {
          id: "owner-1",
          name: "Alex Owner",
          bio: "Booking Service owner",
        }
      : url.endsWith("/owner/booking-types")
        ? { items: [bookingType] }
        : url.endsWith("/owner/bookings")
          ? upcomingBookings
          : {};

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
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

describe("OwnerDashboardPage", () => {
  it("shows all upcoming bookings together with their booking type and time slot", async () => {
    renderOwnerDashboard();

    await waitFor(() => {
      assert.ok(screen.getByText("Engineering pairing"));
      assert.equal(screen.getAllByText("Product strategy").length, 2);
    });

    assert.ok(screen.getByText("Upcoming Bookings"));
    assert.ok(screen.getByText("Engineering pairing"));
    assert.ok(screen.getByText("October 15, 2026 · 10:00 AM–10:30 AM UTC"));
    assert.ok(screen.getByText("October 16, 2026 · 2:00 PM–2:30 PM UTC"));
  });
});
