# Booking Service

A simplified Cal.com-style web application where an owner offers bookable session types and a guest books a time slot for a call. Built as a learning project to practice the full development cycle — from API contract to deployment — using AI agents as the primary coding tool.

The app is intentionally limited: no authentication, no personal accounts, no external calendar integrations. The focus is on the core booking flow and the Design First approach — defining the API contract before building the frontend and backend separately.

## Language

**Booking Service**:
A web app that lets an owner offer bookable session types and guests book time slots on them for calls. Inspired by [Cal.com](https://cal.com/) but stripped to the essentials.
_Avoid_: reservation system, scheduling app

**Booking Type**:
A kind of call the Owner offers, with its own title, description and duration. Every Time Slot and every Booking belongs to exactly one.
_Avoid_: event type, service, meeting type

**Time Slot**:
A window of availability on the Owner's Calendar that a Guest can book. Its length is determined by the Booking Type it belongs to.
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
A person who views available time slots and books one for a call.
_Avoid_: customer, user, visitor, attendee

**API Contract**:
The TypeSpec-defined interface between frontend and backend, established before either is implemented. Serves as the single source of truth for both sides.
_Avoid_: schema, spec, interface definition
