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
