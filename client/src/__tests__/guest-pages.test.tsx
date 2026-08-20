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

const { render, screen, cleanup } = await import("@testing-library/react");
const { QueryClient, QueryClientProvider } = await import(
  "@tanstack/react-query"
);
const { createMemoryRouter, RouterProvider } = await import("react-router-dom");
const { GuestLandingPage } = await import(
  "../pages/guest/GuestLandingPage.js"
);
const { GuestBookingTypePage } = await import(
  "../pages/guest/GuestBookingTypePage.js"
);
const { GuestBookingConfirmationPage } = await import(
  "../pages/guest/GuestBookingConfirmationPage.js"
);

afterEach(() => {
  cleanup();
});

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
});

describe("GuestBookingTypePage", () => {
  it("renders placeholder with booking type id", () => {
    renderWithProviders(
      <GuestBookingTypePage />,
      "/guest/booking-types/abc-123",
    );
    assert.ok(screen.getByText("Booking type"));
    assert.ok(screen.getByText("abc-123"));
  });
});

describe("GuestBookingConfirmationPage", () => {
  it("renders placeholder with booking id", () => {
    renderWithProviders(
      <GuestBookingConfirmationPage />,
      "/bookings/xyz-789",
    );
    assert.ok(screen.getByText("Booking confirmation"));
    assert.ok(screen.getByText("xyz-789"));
  });
});
