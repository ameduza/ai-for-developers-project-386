### Hexlet tests and linter status:

[![Actions Status](https://github.com/ameduza/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/ameduza/ai-for-developers-project-386/actions)

# Booking Service

A simplified Cal.com-style web application where an Owner defines Booking Types that derive available Time Slots for a Guest to book for a call. Built as a learning project to practice the full development cycle — from API Contract to deployment — using AI agents as the primary coding tool.

The app is intentionally limited: no authentication, no personal accounts, no external calendar integrations. The focus is on the core booking flow and the Design First approach — defining the API contract before building the frontend and backend separately.

## Local development

Install the workspace dependencies, then start the client development workflow
from the repository root:

```sh
npm ci
npm run dev --workspace client
```

This is the default local workflow. It generates the API client, starts the real
Booking Service on `http://localhost:3000`, and starts the Vite client. The
client sends its API requests to that Booking Service. The paired processes stop
together when either one exits.

For contract-oriented client work that does not need the real Booking Service,
run the explicit Prism workflow instead:

```sh
npm run dev:mock --workspace client
```

That command starts Prism on `http://127.0.0.1:4010` alongside Vite and points
the client at the mock API.

## Docker

Build the production image from the repository root. The build installs the
committed lockfile exactly, produces the browser assets, and compiles the API
server:

```sh
docker build -t booking-service .
```

Run the complete Booking Service on a non-default port by giving the container
and the published host port the same value:

```sh
docker run --rm -e PORT=8080 -p 8080:8080 booking-service
```

Open `http://localhost:8080`. In the production image, browser requests use the
same service's `/api` path. The local development commands above continue to run
Vite and the API as separate processes.

## API contract generation

`typespec/main.tsp` is the single API contract. After changing it, regenerate
the API artifacts:

```sh
npm run generate:api --workspace client
```

Commit the generated changes together with the contract change. CI runs the same
command and rejects stale generated files.
