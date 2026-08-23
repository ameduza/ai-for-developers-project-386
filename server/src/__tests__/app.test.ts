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
