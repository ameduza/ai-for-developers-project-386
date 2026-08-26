# Time Slots are derived, not stored

The earlier `CONTEXT.md` wording described the Owner as publishing availability. The API Contract has no endpoint for creating a Time Slot — only `GET /booking-types/{id}/slots` for reading derived Time Slots. We decided the server **derives** Time Slots on demand from a fixed availability rule (Mon–Fri, 09:00–17:00 UTC, stepped by the Booking Type's `durationMinutes`, from the next whole step after now through now + 14 days) rather than storing them. Bookings are therefore the only persisted entity, and each derived Time Slot's `available` flag is computed by intersecting the grid with existing Bookings.

## Consequences

A derived Time Slot has no independent existence, so its `id` must be **deterministic** — derived from the Booking Type and start time — or a Guest's selected Time Slot id would break on every refetch.

Because availability is computed rather than stored, cancelling a Booking makes its derived Time Slot available again with no extra bookkeeping, and a Booking blocks *every* intersecting derived Time Slot across *all* Booking Types (see `Owner's Calendar` in `CONTEXT.md`) rather than only the one it was booked through. Booking Types have differing durations, so these intersections are genuine overlaps, not just equal start times.

The rejected alternative was adding Owner-facing Time Slot publishing endpoints to the API Contract and storing Time Slots as real records. **Historical wording:** this matches the earlier "owner publishes slots" description, but it widens Step 4 from "implement the contract" to "redesign the contract", and it would leave the app unusable on a cold start until the Owner had published Time Slots by hand.

Revisiting this — to support ad-hoc availability, holidays, or per-Booking-Type working hours — means introducing stored Time Slots and reworking the Guest flow around them.
