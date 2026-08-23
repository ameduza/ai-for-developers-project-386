import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { createApp } from "../app.js";

test("createApp serves requests through a real ephemeral server", async () => {
  const server = createApp({
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    seed: 1,
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
): Promise<Response> {
  const server = createApp({
    now: () => new Date("2026-01-01T00:00:00.000Z"),
    seed: 1,
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
    seed: 1,
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
  const server = createApp({ now: () => new Date(), seed: 1 }).listen(0);
  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const createResponse = await fetch(`${baseUrl}/owner/booking-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Design review",
        description: "Review a design and identify practical improvements.",
        durationMinutes: 45,
      }),
    });
    const created = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.match(created.id, /^booking-type-/);

    const listResponse = await fetch(`${baseUrl}/booking-types`);
    const list = await listResponse.json();
    assert.ok(
      list.items.some((item: { id: string }) => item.id === created.id),
    );
  } finally {
    server.close();
  }
});

test("rejects malformed JSON and nonsensical booking type durations", async () => {
  const malformedResponse = await requestApp("/owner/booking-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformedResponse.status, 400);
  assert.equal((await malformedResponse.json()).code, "VALIDATION_FAILED");

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
  assert.equal((await invalidResponse.json()).code, "VALIDATION_FAILED");
});

test("creates a booking and makes intersecting slots unavailable globally", async () => {
  const server = createApp({
    now: () => new Date("2026-01-01T08:00:00.000Z"),
    seed: 1,
  }).listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const booking = {
      bookingTypeId: "booking-type-2",
      timeSlotStart: "2026-01-01T10:00:00.000Z",
      timeSlotEnd: "2026-01-01T11:00:00.000Z",
      guestName: "Sam Guest",
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

test("enforces booking validation order and does not persist rejected requests", async () => {
  const server = createApp({
    now: () => new Date("2026-01-01T10:45:00.000Z"),
    seed: 1,
  }).listen(0);

  try {
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const requestBooking = async (body: unknown) =>
      fetch(`${baseUrl}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    const valid = {
      bookingTypeId: "booking-type-1",
      timeSlotStart: "2026-01-01T10:30:00.000Z",
      timeSlotEnd: "2026-01-01T11:00:00.000Z",
      guestName: "Sam Guest",
      guestEmail: "sam@example.com",
    };

    const invalidEmailResponse = await requestBooking({
      ...valid,
      guestEmail: "a@.b.c",
    });
    assert.equal(invalidEmailResponse.status, 400);
    assert.equal((await invalidEmailResponse.json()).code, "VALIDATION_FAILED");
    assert.equal(
      (await requestBooking({ ...valid, bookingTypeId: "missing" })).status,
      404,
    );
    assert.equal((await requestBooking(valid)).status, 400);
    assert.equal(
      (
        await requestBooking({
          ...valid,
          timeSlotStart: "2026-01-01T10:45:00.000Z",
          timeSlotEnd: "2026-01-01T11:15:00.000Z",
        })
      ).status,
      400,
    );

    const bookingsResponse = await fetch(`${baseUrl}/owner/bookings`);
    assert.deepEqual((await bookingsResponse.json()).items, []);
  } finally {
    server.close();
  }
});

test("allows abutting bookings but rejects overlapping bookings across types", async () => {
  const server = createApp({
    now: () => new Date("2026-01-01T08:00:00.000Z"),
    seed: 1,
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
    seed: 1,
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
    seed: 1,
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
