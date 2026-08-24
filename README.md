### Hexlet tests and linter status:
[![Actions Status](https://github.com/ameduza/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/ameduza/ai-for-developers-project-386/actions)

# Booking Service

A simplified Cal.com-style web application where an owner publishes available time slots and a visitor books one for a call. Built as a learning project to practice the full development cycle — from API contract to deployment — using AI agents as the primary coding tool.

The app is intentionally limited: no authentication, no personal accounts, no external calendar integrations. The focus is on the core booking flow and the Design First approach — defining the API contract before building the frontend and backend separately.

## Server API Contract models

The server consumes its protocol model types from the committed artifact generated from `typespec/main.tsp`.

```sh
npm run generate:models --workspace server
```

`npm run typecheck --workspace server` verifies the artifact is current without changing the working tree. Run the generation command after changing the API Contract, then commit the updated artifact.
