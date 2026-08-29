# Booking Service

[![Actions Status](https://github.com/ameduza/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/ameduza/ai-for-developers-project-386/actions)

**[Open the live demo](https://ai-for-developers-project-386-s8nr.onrender.com/)**

> Demo data is stored in memory and can reset when the service restarts or is
> redeployed.

A simplified Cal.com-style web application where an Owner defines Booking Types
that derive available Time Slots for a Guest to book for a call. Built as a
learning project to practice the full development cycle—from API Contract to
deployment—using AI agents as the primary coding tool.

The app is intentionally limited: no authentication, no personal accounts, and
no external calendar integrations. The focus is the core booking flow and a
Design First approach that establishes the API Contract before implementing the
frontend and backend.

## Local development

Requires Node.js 22.5 or newer.

```sh
npm ci
npm run dev --workspace client
```

Open `http://localhost:5173`. This workflow generates the API client and starts
both the Booking Service API on `http://localhost:3000` and the Vite client.

To develop the client against the Prism mock API instead:

```sh
npm run dev:mock --workspace client
```

## Docker

Build and run the production image from the repository root:

```sh
docker build -t booking-service .
docker run --rm -e PORT=8080 -p 8080:8080 booking-service
```

Open `http://localhost:8080`.

## API Contract generation

`typespec/main.tsp` is the source of truth for the API Contract. After changing
it, regenerate the API artifacts:

```sh
npm run generate:api --workspace client
```

Commit the generated changes with the contract change. CI rejects stale
generated files.
