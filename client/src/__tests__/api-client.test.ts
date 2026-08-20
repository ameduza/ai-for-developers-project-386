import { describe, it } from "node:test";
import assert from "node:assert/strict";

process.env.VITE_API_BASE_URL = "http://127.0.0.1:4010";

const { DefaultService, OpenAPI, ApiError, CancelablePromise, CancelError } =
  await import("../lib/api/generated/index.js");

describe("generated API client exports", () => {
  it("exports DefaultService with expected methods", () => {
    assert.ok(DefaultService);
    assert.equal(typeof DefaultService.bookingTypesListBookingTypes, "function");
    assert.equal(typeof DefaultService.bookingTypesListSlots, "function");
    assert.equal(typeof DefaultService.bookingsCreate, "function");
    assert.equal(typeof DefaultService.bookingsGet, "function");
    assert.equal(typeof DefaultService.bookingsDelete, "function");
    assert.equal(typeof DefaultService.ownerRoutesGetOwner, "function");
    assert.equal(typeof DefaultService.ownerRoutesListBookingTypes, "function");
    assert.equal(typeof DefaultService.ownerRoutesCreateBookingType, "function");
    assert.equal(
      typeof DefaultService.ownerRoutesListUpcomingBookings,
      "function",
    );
  });

  it("exports OpenAPI config", () => {
    assert.ok(OpenAPI);
    assert.ok("BASE" in OpenAPI);
    assert.ok("WITH_CREDENTIALS" in OpenAPI);
    assert.ok("CREDENTIALS" in OpenAPI);
  });

  it("exports error and promise utilities", () => {
    assert.ok(ApiError);
    assert.ok(CancelablePromise);
    assert.ok(CancelError);
  });
});
