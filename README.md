### Hexlet tests and linter status:

[![Actions Status](https://github.com/ameduza/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/ameduza/ai-for-developers-project-386/actions)

# Booking Service

A simplified Cal.com-style web application where an Owner defines Booking Types that derive available Time Slots for a Guest to book for a call. Built as a learning project to practice the full development cycle — from API Contract to deployment — using AI agents as the primary coding tool.

The app is intentionally limited: no authentication, no personal accounts, no external calendar integrations. The focus is on the core booking flow and the Design First approach — defining the API contract before building the frontend and backend separately.

## API contract generation

`typespec/main.tsp` is the single API contract. Generating it produces both the
OpenAPI 3.1 document used by the client and TypeSpec's Express-compatible server
router, operation interfaces, and protocol models under `server/src/generated/typespec`.

```sh
npm run build:contract
```

Run this command after changing the contract, then commit the generated artifacts.
`npm run typecheck --workspace server` regenerates the contract artifacts before
type checking so local and CI builds use the same bindings.
