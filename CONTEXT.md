# Booking Service

A simplified Cal.com-style web application where an owner publishes available time slots and a visitor books one for a call. Built as a learning project to practice the full development cycle — from API contract to deployment — using AI agents as the primary coding tool.

The app is intentionally limited: no authentication, no personal accounts, no external calendar integrations. The focus is on the core booking flow and the Design First approach — defining the API contract before building the frontend and backend separately.

## Language

**Booking Service**:
A web app that lets an owner publish 30-minute time slots and visitors book them for calls. Inspired by [Cal.com](https://cal.com/) but stripped to the essentials.
_Avoid_: reservation system, scheduling app

**Time Slot**:
A 30-minute window of availability published by the owner. Fixed duration, not configurable.
_Avoid_: meeting, appointment, event, slot

**Booking**:
A visitor's selection of a time slot, confirming they will attend a call at that time.
_Avoid_: reservation, registration, appointment

**Owner**:
The person whose calendar is being booked. They publish available time slots and can view upcoming meetings.
_Avoid_: admin, host, provider, user

**Guest**:
A person who views available time slots and books one for a call.
_Avoid_: customer, user, visitor, attendee

**API Contract**:
The TypeSpec-defined interface between frontend and backend, established before either is implemented. Serves as the single source of truth for both sides.
_Avoid_: schema, spec, interface definition
