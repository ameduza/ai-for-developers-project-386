# Time Slots are derived, not stored

`CONTEXT.md` describes the Owner as publishing availability, but the API Contract has no endpoint for creating a Time Slot — only `GET /booking-types/{id}/slots` for reading them. We decided the server **generates** Time Slots on demand from a fixed availability rule (Mon–Fri, 09:00–17:00 UTC, stepped by the Booking Type's `durationMinutes`, from now through now + 14 days) rather than storing them, so Bookings are the only persisted entity and a slot's `available` flag is computed by intersecting the grid with existing Bookings.

## Consequences

A Time Slot has no independent existence, so its `id` must be **deterministic** — derived from the Booking Type and start time — or a client's selected slot id would break on every refetch.

Because availability is computed rather than stored, cancelling a Booking frees its Time Slot with no extra bookkeeping, and a Booking blocks *every* intersecting Time Slot across *all* Booking Types (see `Owner's Calendar` in `CONTEXT.md`) rather than only the one it was booked through. Booking Types have differing durations, so these intersections are genuine overlaps, not just equal start times.

The rejected alternative was adding owner slot-publishing endpoints to the contract and storing slots as real records. That matches the original "owner publishes slots" wording, but it widens Step 4 from "implement the contract" to "redesign the contract", and it would leave the app unusable on a cold start until the Owner had published slots by hand.

Revisiting this — to support ad-hoc availability, holidays, or per-Booking-Type working hours — means introducing stored slots and reworking the guest flow around them.
