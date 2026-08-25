import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createApp } from "../app.js";

type Fixture = Parameters<typeof createApp>[0]["fixture"];

function createFixture(): Fixture {
  return {
    owner: {
      id: "owner-1",
      name: "Test Owner",
      bio: "A fixture-owned profile.",
    },
    bookingTypes: [
      {
        id: "booking-type-1",
        title: "Short call",
        description: "A short fixture booking type.",
        durationMinutes: 30,
      },
      {
        id: "booking-type-2",
        title: "Long call",
        description: "A long fixture booking type.",
        durationMinutes: 60,
      },
      {
        id: "booking-type-3",
        title: "Workshop",
        description: "A workshop fixture booking type.",
        durationMinutes: 90,
      },
    ],
    bookings: [],
  };
}

function createRejectionFixture(): Fixture {
  const fixture = createFixture();
  fixture.bookings.push(
    {
      id: "booking-1",
      bookingTypeId: "booking-type-2",
      timeSlot: {
        id: "existing-morning-slot",
        startTime: "2026-01-01T10:00:00.000Z",
        endTime: "2026-01-01T11:00:00.000Z",
        available: false,
      },
      guest: { name: "Morning Guest", email: "morning@example.com" },
    },
    {
      id: "booking-2",
      bookingTypeId: "booking-type-2",
      timeSlot: {
        id: "existing-afternoon-slot",
        startTime: "2026-01-01T12:00:00.000Z",
        endTime: "2026-01-01T13:00:00.000Z",
        available: false,
      },
      guest: { name: "Afternoon Guest", email: "afternoon@example.com" },
    },
  );
  return fixture;
}

async function withTestServer(
  options: Parameters<typeof createApp>[0],
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const server = createApp(options).listen(0);
  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    await run(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

async function getBookingProjections(
  baseUrl: string,
  bookingTypeId: string,
): Promise<{ timeSlots: unknown; upcomingBookings: unknown }> {
  const [timeSlotsResponse, upcomingBookingsResponse] = await Promise.all([
    fetch(`${baseUrl}/booking-types/${bookingTypeId}/slots`),
    fetch(`${baseUrl}/owner/bookings`),
  ]);
  assert.equal(timeSlotsResponse.status, 200);
  assert.equal(upcomingBookingsResponse.status, 200);
  return {
    timeSlots: await timeSlotsResponse.json(),
    upcomingBookings: await upcomingBookingsResponse.json(),
  };
}

function postBooking(baseUrl: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

interface RejectedBookingScenario {
  now: Date;
  relevantBookingTypeId: string;
  body: unknown;
  expectedStatus: number;
  expectedError: { code: string; message: string };
}

async function assertRejectedBookingIsAtomic({
  now,
  relevantBookingTypeId,
  body,
  expectedStatus,
  expectedError,
}: RejectedBookingScenario): Promise<void> {
  await withTestServer(
    {
      now: () => new Date(now),
      fixture: createRejectionFixture(),
    },
    async (baseUrl) => {
      const before = await getBookingProjections(
        baseUrl,
        relevantBookingTypeId,
      );
      const response = await postBooking(baseUrl, body);

      assert.equal(response.status, expectedStatus);
      assert.deepEqual(await response.json(), expectedError);
      const after = await getBookingProjections(baseUrl, relevantBookingTypeId);
      assert.deepEqual(after.timeSlots, before.timeSlots);
      assert.deepEqual(after.upcomingBookings, before.upcomingBookings);
    },
  );
}

test("createApp serves requests through a real ephemeral server", async () => {
  const server = createApp({
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    fixture: createFixture(),
  }).listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/not-a-route`, {
      headers: { Origin: "http://localhost:5173" },
    });

    assert.equal(response.status, 404);
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:5173",
    );
  } finally {
    server.close();
  }
});

async function requestApp(
  request: RequestInfo | URL,
  init?: RequestInit,
  fixture = createFixture(),
): Promise<Response> {
  const server = createApp({
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    fixture,
  }).listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    return await fetch(`http://127.0.0.1:${port}${request}`, init);
  } finally {
    server.close();
  }
}

test("lists the seeded owner and booking types", async () => {
  const ownerResponse = await requestApp("/owner");
  const owner = await ownerResponse.json();
  assert.equal(owner.id, "owner-1");

  const typesResponse = await requestApp("/booking-types");
  const types = await typesResponse.json();
  assert.equal(types.items.length, 3);
  assert.notEqual(
    types.items[0].durationMinutes,
    types.items[1].durationMinutes,
  );
});

test("lists a deterministic weekday time-slot grid for a booking type", async () => {
  const server = createApp({
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    fixture: createFixture(),
  }).listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const firstResponse = await fetch(
      `http://127.0.0.1:${port}/booking-types/booking-type-1/slots`,
    );
    const secondResponse = await fetch(
      `http://127.0.0.1:${port}/booking-types/booking-type-1/slots`,
    );
    const first = await firstResponse.json();
    const second = await secondResponse.json();

    assert.equal(firstResponse.status, 200);
    assert.equal(first.items.length, 160);
    assert.deepEqual(first.items, second.items);
    assert.deepEqual(first.items[0], {
      id: "slot-8ff1f83fad3326360a893ac9",
      startTime: "2026-01-01T09:00:00.000Z",
      endTime: "2026-01-01T09:30:00.000Z",
      available: true,
    });
    assert.equal(first.items.at(-1).startTime, "2026-01-14T16:30:00.000Z");
    assert.ok(
      first.items.every(
        (slot: { startTime: string; endTime: string; available: boolean }) => {
          const start = new Date(slot.startTime);
          const end = new Date(slot.endTime);
          return (
            start.getUTCDay() >= 1 &&
            start.getUTCDay() <= 5 &&
            start.getUTCHours() >= 9 &&
            end.getUTCHours() <= 17 &&
            end.getTime() - start.getTime() === 30 * 60 * 1000 &&
            slot.available
          );
        },
      ),
    );
  } finally {
    server.close();
  }
});

test("returns a clear not-found error for unknown booking types", async () => {
  const response = await requestApp("/booking-types/missing/slots");
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    code: "BOOKING_TYPE_NOT_FOUND",
    message: "Booking type not found",
  });
});

test("creates a booking type and returns it in the guest list", async () => {
  const server = createApp({
    now: () => new Date(),
    fixture: createFixture(),
  }).listen(0);
  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const createResponse = await fetch(`${baseUrl}/owner/booking-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: " Design review ",
        description: " Review a design and identify practical improvements. ",
        durationMinutes: 45,
      }),
    });
    const created = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.match(created.id, /^booking-type-/);
    assert.equal(created.title, " Design review ");
    assert.equal(
      created.description,
      " Review a design and identify practical improvements. ",
    );

    const listResponse = await fetch(`${baseUrl}/booking-types`);
    const list = await listResponse.json();
    assert.ok(
      list.items.some((item: { id: string }) => item.id === created.id),
    );
  } finally {
    server.close();
  }
});

test("rejects malformed JSON and invalid booking type bodies with stable validation errors", async () => {
  const malformedResponse = await requestApp("/owner/booking-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformedResponse.status, 400);
  assert.deepEqual(await malformedResponse.json(), {
    code: "VALIDATION_FAILED",
    message: "Invalid JSON body",
  });

  const invalidResponse = await requestApp("/owner/booking-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Invalid",
      description: "This duration is not meaningful.",
      durationMinutes: 0,
    }),
  });
  assert.equal(invalidResponse.status, 400);
  assert.deepEqual(await invalidResponse.json(), {
    code: "VALIDATION_FAILED",
    message: "Invalid booking type",
  });

  const blankTextResponse = await requestApp("/owner/booking-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "   ",
      description: "\t",
      durationMinutes: 30,
    }),
  });
  assert.deepEqual(await blankTextResponse.json(), {
    code: "VALIDATION_FAILED",
    message: "Invalid booking type",
  });
});

test("rejects an invalid Booking before later rules without changing projections", async () => {
  await assertRejectedBookingIsAtomic({
    now: new Date("2026-01-01T10:45:00.000Z"),
    relevantBookingTypeId: "booking-type-1",
    body: {
      bookingTypeId: "missing",
      timeSlotStart: "2026-01-01T10:15:00.000Z",
      timeSlotEnd: "2026-01-01T10:45:00.000Z",
      guestName: "Guest",
      // The previous custom validator accepted spaces in the local part.
      guestEmail: "guest name@example.com",
    },
    expectedStatus: 400,
    expectedError: {
      code: "VALIDATION_FAILED",
      message: "Invalid booking",
    },
  });
});

test("rejects a missing Booking Type before later Time Slot rules without changing projections", async () => {
  await assertRejectedBookingIsAtomic({
    now: new Date("2026-01-01T10:45:00.000Z"),
    relevantBookingTypeId: "booking-type-1",
    body: {
      bookingTypeId: "missing",
      // Relative to the control Booking Type, this is off-grid, past, and
      // overlaps booking-1. Missing Booking Type must still win.
      timeSlotStart: "2026-01-01T10:15:00.000Z",
      timeSlotEnd: "2026-01-01T10:45:00.000Z",
      guestName: "Guest",
      guestEmail: "guest@example.com",
    },
    expectedStatus: 404,
    expectedError: {
      code: "BOOKING_TYPE_NOT_FOUND",
      message: "Booking type not found",
    },
  });
});

test("rejects an off-grid Time Slot before past and conflict rules without changing projections", async () => {
  await assertRejectedBookingIsAtomic({
    now: new Date("2026-01-01T10:45:00.000Z"),
    relevantBookingTypeId: "booking-type-1",
    body: {
      bookingTypeId: "booking-type-1",
      // This interval is also past and overlaps booking-1.
      timeSlotStart: "2026-01-01T10:15:00.000Z",
      timeSlotEnd: "2026-01-01T10:45:00.000Z",
      guestName: "Guest",
      guestEmail: "guest@example.com",
    },
    expectedStatus: 400,
    expectedError: {
      code: "SLOT_NOT_ON_GRID",
      message: "Time slot is not on the booking grid",
    },
  });
});

test("rejects a past Time Slot before the conflict rule without changing projections", async () => {
  await assertRejectedBookingIsAtomic({
    now: new Date("2026-01-01T10:45:00.000Z"),
    relevantBookingTypeId: "booking-type-1",
    body: {
      bookingTypeId: "booking-type-1",
      // This is a grid-aligned interval that also overlaps booking-1.
      timeSlotStart: "2026-01-01T10:00:00.000Z",
      timeSlotEnd: "2026-01-01T10:30:00.000Z",
      guestName: "Guest",
      guestEmail: "guest@example.com",
    },
    expectedStatus: 400,
    expectedError: {
      code: "SLOT_IN_PAST",
      message: "Time slot is in the past",
    },
  });
});

test("rejects an unavailable Time Slot without changing projections", async () => {
  await assertRejectedBookingIsAtomic({
    now: new Date("2026-01-01T08:00:00.000Z"),
    relevantBookingTypeId: "booking-type-1",
    body: {
      bookingTypeId: "booking-type-1",
      // This future grid interval overlaps booking-1 on the Owner's Calendar.
      timeSlotStart: "2026-01-01T10:30:00.000Z",
      timeSlotEnd: "2026-01-01T11:00:00.000Z",
      guestName: "Guest",
      guestEmail: "guest@example.com",
    },
    expectedStatus: 409,
    expectedError: {
      code: "SLOT_NOT_AVAILABLE",
      message: "Time slot is not available",
    },
  });
});

test("creates a booking and makes intersecting slots unavailable globally", async () => {
  const server = createApp({
    now: () => new Date("2026-01-01T08:00:00.000Z"),
    fixture: createFixture(),
  }).listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const booking = {
      bookingTypeId: "booking-type-2",
      timeSlotStart: "2026-01-01T10:00:00.000Z",
      timeSlotEnd: "2026-01-01T11:00:00.000Z",
      guestName: "  Sam Guest  ",
      guestEmail: "sam@example.com",
    };

    const createResponse = await fetch(`${baseUrl}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    const created = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.match(created.id, /^booking-/);
    assert.equal(created.bookingType.id, booking.bookingTypeId);
    assert.equal(created.guest.name, "Sam Guest");
    assert.deepEqual(created.timeSlot, {
      id: "slot-22c6fa6d597dde7d217adeab",
      startTime: booking.timeSlotStart,
      endTime: booking.timeSlotEnd,
      available: false,
    });

    const slotsResponse = await fetch(
      `${baseUrl}/booking-types/booking-type-1/slots`,
    );
    const slots = await slotsResponse.json();
    assert.equal(
      slots.items.find(
        (slot: { startTime: string }) =>
          slot.startTime === "2026-01-01T10:30:00.000Z",
      ).available,
      false,
    );
  } finally {
    server.close();
  }
});

test("allows abutting bookings but rejects overlapping bookings across types", async () => {
  const server = createApp({
    now: () => new Date("2026-01-01T08:00:00.000Z"),
    fixture: createFixture(),
  }).listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${port}/bookings`;
    const create = (
      start: string,
      end: string,
      bookingTypeId = "booking-type-1",
    ) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingTypeId,
          timeSlotStart: start,
          timeSlotEnd: end,
          guestName: "Sam Guest",
          guestEmail: "sam@example.com",
        }),
      });

    assert.equal(
      (
        await create(
          "2026-01-01T10:00:00.000Z",
          "2026-01-01T11:00:00.000Z",
          "booking-type-2",
        )
      ).status,
      201,
    );
    assert.equal(
      (await create("2026-01-01T11:00:00.000Z", "2026-01-01T11:30:00.000Z"))
        .status,
      201,
    );
    assert.equal(
      (await create("2026-01-01T10:30:00.000Z", "2026-01-01T11:00:00.000Z"))
        .status,
      409,
    );
  } finally {
    server.close();
  }
});

test("fetches and cancels a booking, freeing its time slot", async () => {
  const server = createApp({
    now: () => new Date("2026-01-01T08:00:00.000Z"),
    fixture: createFixture(),
  }).listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const createResponse = await fetch(`${baseUrl}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingTypeId: "booking-type-1",
        timeSlotStart: "2026-01-01T10:00:00.000Z",
        timeSlotEnd: "2026-01-01T10:30:00.000Z",
        guestName: "Sam Guest",
        guestEmail: "sam@example.com",
      }),
    });
    const created = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const getResponse = await fetch(`${baseUrl}/bookings/${created.id}`);
    assert.equal(getResponse.status, 200);
    assert.deepEqual(await getResponse.json(), created);

    const deleteResponse = await fetch(`${baseUrl}/bookings/${created.id}`, {
      method: "DELETE",
    });
    assert.equal(deleteResponse.status, 204);
    assert.equal(await deleteResponse.text(), "");

    const slotsResponse = await fetch(
      `${baseUrl}/booking-types/booking-type-1/slots`,
    );
    const slots = await slotsResponse.json();
    assert.equal(
      slots.items.find(
        (slot: { startTime: string }) =>
          slot.startTime === "2026-01-01T10:00:00.000Z",
      ).available,
      true,
    );
  } finally {
    server.close();
  }
});

test("returns booking not found for unknown and already-cancelled bookings", async () => {
  const server = createApp({
    now: () => new Date("2026-01-01T08:00:00.000Z"),
    fixture: createFixture(),
  }).listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const notFound = {
      code: "BOOKING_NOT_FOUND",
      message: "Booking not found",
    };

    const unknownGetResponse = await fetch(`${baseUrl}/bookings/missing`);
    assert.equal(unknownGetResponse.status, 404);
    assert.deepEqual(await unknownGetResponse.json(), notFound);

    const unknownDeleteResponse = await fetch(`${baseUrl}/bookings/missing`, {
      method: "DELETE",
    });
    assert.equal(unknownDeleteResponse.status, 404);
    assert.deepEqual(await unknownDeleteResponse.json(), notFound);

    const createResponse = await fetch(`${baseUrl}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingTypeId: "booking-type-1",
        timeSlotStart: "2026-01-01T10:00:00.000Z",
        timeSlotEnd: "2026-01-01T10:30:00.000Z",
        guestName: "Sam Guest",
        guestEmail: "sam@example.com",
      }),
    });
    const created = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const firstDeleteResponse = await fetch(
      `${baseUrl}/bookings/${created.id}`,
      { method: "DELETE" },
    );
    assert.equal(firstDeleteResponse.status, 204);

    const secondDeleteResponse = await fetch(
      `${baseUrl}/bookings/${created.id}`,
      { method: "DELETE" },
    );
    assert.equal(secondDeleteResponse.status, 404);
    assert.deepEqual(await secondDeleteResponse.json(), notFound);
  } finally {
    server.close();
  }
});

test("lists only upcoming bookings in start-time order with guest contact details", async () => {
  const fixture = createFixture();
  fixture.bookings.push(
    {
      id: "booking-1",
      bookingTypeId: "booking-type-1",
      timeSlot: {
        id: "past-slot",
        startTime: "2026-01-01T07:00:00.000Z",
        endTime: "2026-01-01T07:30:00.000Z",
        available: false,
      },
      guest: { name: "Past Guest", email: "past@example.com" },
    },
    {
      id: "booking-2",
      bookingTypeId: "booking-type-2",
      timeSlot: {
        id: "late-slot",
        startTime: "2026-01-01T11:00:00.000Z",
        endTime: "2026-01-01T12:00:00.000Z",
        available: false,
      },
      guest: { name: "Grace Hopper", email: "grace@example.com" },
    },
    {
      id: "booking-3",
      bookingTypeId: "booking-type-1",
      timeSlot: {
        id: "early-slot",
        startTime: "2026-01-01T09:00:00.000Z",
        endTime: "2026-01-01T09:30:00.000Z",
        available: false,
      },
      guest: { name: "Ada Lovelace", email: "ada@example.com" },
    },
  );

  const server = createApp({
    now: () => new Date("2026-01-01T08:00:00.000Z"),
    fixture,
  }).listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/owner/bookings`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      items: [
        {
          id: "booking-3",
          bookingType: fixture.bookingTypes[0],
          timeSlot: {
            id: "early-slot",
            startTime: "2026-01-01T09:00:00.000Z",
            endTime: "2026-01-01T09:30:00.000Z",
            available: false,
          },
          guest: { name: "Ada Lovelace", email: "ada@example.com" },
        },
        {
          id: "booking-2",
          bookingType: fixture.bookingTypes[1],
          timeSlot: {
            id: "late-slot",
            startTime: "2026-01-01T11:00:00.000Z",
            endTime: "2026-01-01T12:00:00.000Z",
            available: false,
          },
          guest: { name: "Grace Hopper", email: "grace@example.com" },
        },
      ],
    });

    assert.equal(
      await fetch(`http://127.0.0.1:${port}/bookings/booking-2`, {
        method: "DELETE",
      }).then((deleteResponse) => deleteResponse.status),
      204,
    );
    assert.deepEqual(
      (
        await (await fetch(`http://127.0.0.1:${port}/owner/bookings`)).json()
      ).items.map((booking: { id: string }) => booking.id),
      ["booking-3"],
    );
  } finally {
    server.close();
  }
});

test("serves normalized, sorted fixture bookings without retaining fixture references", async () => {
  const fixture = createFixture();
  fixture.bookings.push(
    {
      id: "booking-7",
      bookingTypeId: "booking-type-2",
      timeSlot: {
        id: "fixture-late-slot",
        startTime: "2026-01-01T11:00:00.000Z",
        endTime: "2026-01-01T12:00:00.000Z",
        available: false,
      },
      guest: { name: "Grace Hopper", email: "grace@example.com" },
    },
    {
      id: "booking-3",
      bookingTypeId: "booking-type-1",
      timeSlot: {
        id: "fixture-early-slot",
        startTime: "2026-01-01T09:00:00.000Z",
        endTime: "2026-01-01T09:30:00.000Z",
        available: false,
      },
      guest: { name: "Ada Lovelace", email: "ada@example.com" },
    },
  );
  const server = createApp({
    now: () => new Date("2026-01-01T08:00:00.000Z"),
    fixture,
  }).listen(0);
  fixture.owner.name = "Mutated owner";
  fixture.bookingTypes[0].title = "Mutated type";
  fixture.bookings[1].guest.name = "Mutated guest";

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${port}/owner/bookings`);

    assert.deepEqual(await response.json(), {
      items: [
        {
          id: "booking-3",
          bookingType: {
            id: "booking-type-1",
            title: "Short call",
            description: "A short fixture booking type.",
            durationMinutes: 30,
          },
          timeSlot: {
            id: "fixture-early-slot",
            startTime: "2026-01-01T09:00:00.000Z",
            endTime: "2026-01-01T09:30:00.000Z",
            available: false,
          },
          guest: { name: "Ada Lovelace", email: "ada@example.com" },
        },
        {
          id: "booking-7",
          bookingType: {
            id: "booking-type-2",
            title: "Long call",
            description: "A long fixture booking type.",
            durationMinutes: 60,
          },
          timeSlot: {
            id: "fixture-late-slot",
            startTime: "2026-01-01T11:00:00.000Z",
            endTime: "2026-01-01T12:00:00.000Z",
            available: false,
          },
          guest: { name: "Grace Hopper", email: "grace@example.com" },
        },
      ],
    });
    assert.equal(
      (await (await fetch(`http://127.0.0.1:${port}/owner`)).json()).name,
      "Test Owner",
    );
  } finally {
    server.close();
  }
});

test("allocates identifiers after sparse fixture identifiers", async () => {
  const fixture = createFixture();
  fixture.bookingTypes.pop();
  fixture.bookingTypes[1].id = "booking-type-9";
  fixture.bookings.push({
    id: "booking-12",
    bookingTypeId: "booking-type-1",
    timeSlot: {
      id: "fixture-slot",
      startTime: "2026-01-01T10:00:00.000Z",
      endTime: "2026-01-01T10:30:00.000Z",
      available: false,
    },
    guest: { name: "Fixture Guest", email: "fixture@example.com" },
  });
  const server = createApp({
    now: () => new Date("2026-01-01T08:00:00.000Z"),
    fixture,
  }).listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const bookingType = await (
      await fetch(`${baseUrl}/owner/booking-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New type",
          description: "Created after sparse fixture data.",
          durationMinutes: 30,
        }),
      })
    ).json();
    const booking = await (
      await fetch(`${baseUrl}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingTypeId: "booking-type-1",
          timeSlotStart: "2026-01-01T10:30:00.000Z",
          timeSlotEnd: "2026-01-01T11:00:00.000Z",
          guestName: "New Guest",
          guestEmail: "new@example.com",
        }),
      })
    ).json();

    assert.equal(bookingType.id, "booking-type-10");
    assert.equal(booking.id, "booking-13");
  } finally {
    server.close();
  }
});

test("rejects incoherent fixture identifiers and booking type references", () => {
  const duplicateBookingTypes = createFixture();
  duplicateBookingTypes.bookingTypes.push({
    ...duplicateBookingTypes.bookingTypes[0],
  });
  assert.throws(
    () => createApp({ now: () => new Date(), fixture: duplicateBookingTypes }),
    /Duplicate Booking Type identifier: booking-type-1/,
  );

  const duplicateBookings = createFixture();
  duplicateBookings.bookings.push(
    {
      id: "booking-1",
      bookingTypeId: "booking-type-1",
      timeSlot: {
        id: "first-slot",
        startTime: "2026-01-01T09:00:00.000Z",
        endTime: "2026-01-01T09:30:00.000Z",
        available: false,
      },
      guest: { name: "First Guest", email: "first@example.com" },
    },
    {
      id: "booking-1",
      bookingTypeId: "booking-type-1",
      timeSlot: {
        id: "second-slot",
        startTime: "2026-01-01T10:00:00.000Z",
        endTime: "2026-01-01T10:30:00.000Z",
        available: false,
      },
      guest: { name: "Second Guest", email: "second@example.com" },
    },
  );
  assert.throws(
    () => createApp({ now: () => new Date(), fixture: duplicateBookings }),
    /Duplicate Booking identifier: booking-1/,
  );

  const missingBookingType = createFixture();
  missingBookingType.bookings.push({
    id: "booking-1",
    bookingTypeId: "missing",
    timeSlot: {
      id: "missing-type-slot",
      startTime: "2026-01-01T09:00:00.000Z",
      endTime: "2026-01-01T09:30:00.000Z",
      available: false,
    },
    guest: { name: "Guest", email: "guest@example.com" },
  });
  assert.throws(
    () => createApp({ now: () => new Date(), fixture: missingBookingType }),
    /references missing Booking Type: missing/,
  );
});

test("contains unexpected application-boundary failures and logs their cause once", async () => {
  const fixture = createFixture();
  fixture.bookings.push({
    id: "booking-invalid-interval",
    bookingTypeId: "booking-type-1",
    timeSlot: {
      id: "invalid-slot",
      startTime: "not-a-date",
      endTime: "2026-01-01T10:30:00.000Z",
      available: false,
    },
    guest: { name: "Fixture Guest", email: "fixture@example.com" },
  });
  const originalConsoleError = console.error;
  const errors: unknown[][] = [];
  console.error = (...arguments_) => errors.push(arguments_);

  try {
    const response = await requestApp(
      "/booking-types/booking-type-1/slots",
      undefined,
      fixture,
    );

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    });
    assert.equal(errors.length, 1);
    assert.ok(errors[0][0] instanceof RangeError);
    assert.match((errors[0][0] as Error).message, /valid start before its end/);
  } finally {
    console.error = originalConsoleError;
  }
});
