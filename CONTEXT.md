# Booking Service

A simplified Cal.com-style web application where an Owner defines Booking Types that derive available Time Slots for a Guest to book for a call. Built as a learning project to practice the full development cycle — from API Contract to deployment — using AI agents as the primary coding tool.

The app is intentionally limited: no authentication, no personal accounts, no external calendar integrations. The focus is on the core booking flow and the Design First approach — defining the API contract before building the frontend and backend separately.

## Language

**Booking Service**:
A web app where an Owner defines Booking Types, each of which derives available Time Slots for Guests to book for calls. Inspired by [Cal.com](https://cal.com/) but stripped to the essentials.
_Avoid_: reservation system, scheduling app

**Booking Type**:
A kind of call the Owner defines, with its own title, description and duration. Every derived Time Slot and every Booking belongs to exactly one.
_Avoid_: event type, service, meeting type

**Time Slot**:
A derived window of availability on the Owner's Calendar that a Guest can book. It is generated from the Booking Type it belongs to, so its length is determined by that Booking Type.

Prefer **Time Slot** rather than _slot_ in prose. This prose vocabulary does not rename stable API Contract identifiers, including `SLOT_NOT_AVAILABLE`, `SLOT_IN_PAST`, and `SLOT_NOT_ON_GRID`.

_Avoid_: meeting, appointment, event, slot

**Owner's Calendar**:
The Owner's single real schedule, shared across every Booking Type. A Booking occupies it globally, so it makes every intersecting Time Slot unavailable regardless of which Booking Type offered it.
_Avoid_: availability, agenda, schedule

**Booking**:
A Guest's claim on a Time Slot, confirming they will attend a call at that time.
_Avoid_: reservation, registration, appointment

**Owner**:
The person whose calendar is being booked. They define the Booking Types on offer and can view upcoming Bookings.
_Avoid_: admin, host, provider, user

**Guest**:
A person who views available derived Time Slots and books one for a call.
_Avoid_: customer, user, visitor, attendee

**API Contract**:
The TypeSpec-defined interface between frontend and backend, established before either is implemented. Serves as the single source of truth for both sides.
_Avoid_: schema, spec, interface definition
