# Research: World Cup Prediction Website

## Decision: Use a static 2026 tournament seed plus a pure client-side progression engine

**Rationale**: The spec assumes same-device persistence and does not require account-backed sync, so the fastest and most reliable v1 is a seeded tournament model in source plus deterministic functions that derive standings, best-third advancement, knockout slots, and champion from user score input. This keeps the app responsive, avoids server coupling, and aligns with React guidance to derive state instead of duplicating it.

**Alternatives considered**:
- Fetch the tournament model from a backend on every load: rejected because v1 does not need server availability for core flows.
- Persist derived standings and bracket state directly: rejected because it increases drift risk when earlier scorelines change.

## Decision: Store only a versioned minimal prediction snapshot in localStorage

**Rationale**: The constitution and frontend references both point toward minimal, defensive persistence. The browser snapshot should contain only match scores, knockout advancing-team selections, and card personalization fields. A versioned key with guarded JSON parse/write logic lets us evolve the schema without corrupting returning users.

**Alternatives considered**:
- Save the full derived tournament state: rejected because it bloats storage and becomes invalid when rules change.
- Use IndexedDB from day one: rejected because the data size is small and localStorage is simpler for a single active session.

## Decision: Use a dedicated export card surface with client-side PNG generation

**Rationale**: The export requirement is specifically a polished PNG that matches an on-screen preview. A dedicated export component rendered from the same prediction state gives us a single visual source of truth and avoids maintaining separate export templates. A browser-side PNG library such as `html-to-image` is sufficient for v1 and avoids backend image rendering.

**Alternatives considered**:
- Server-side image rendering: rejected because the spec does not require user accounts or remote storage.
- Canvas-only export UI: rejected because it would duplicate layout logic already present in the export preview screen.

## Decision: Keep tournament calculations in pure functions and compute derived results from render-time state

**Rationale**: Group standings, best-third review, knockout brackets, and champion are all deterministic consequences of match predictions. Implementing them as pure engine functions keeps them unit-testable and avoids effect-driven state drift. Non-urgent recomputations can be wrapped in `startTransition` only if profiling shows score entry jank.

**Alternatives considered**:
- Store each derived table or bracket round in React state: rejected because it introduces extra synchronization code.
- Use a monolithic reducer for all logic and view concerns: rejected because it makes engine testing harder than separating rules from UI.

## Decision: Add tests in three layers before implementation work begins

**Rationale**: The constitution explicitly requires test-first implementation and 80% line coverage. The safest split is:
- Vitest unit tests for standings, advancement, knockout tie resolution, reset behavior, and persistence parsing.
- React Testing Library tests for score-entry and export-gating interactions.
- Playwright end-to-end tests for a complete prediction flow and PNG export flow.

**Alternatives considered**:
- Only component tests: rejected because tournament rules are the highest-risk business logic.
- Only end-to-end tests: rejected because debugging progression bugs would become slow and brittle.

## Decision: Preserve the Stitch-derived common component layer and build feature logic around it

**Rationale**: The newest four Stitch screens already gave us a coherent shared component vocabulary. Reusing that layer keeps the implementation aligned with the chosen visual direction while allowing the actual tournament engine, persistence logic, and export flow to live in feature-specific modules.

**Alternatives considered**:
- Regenerate screen-level components again before implementation: rejected because it would churn stable UI scaffolding without adding user value.
- Ignore the common layer and rebuild screens ad hoc: rejected because it would create duplication and visual drift.

## Local Development Quickstart

- **Prerequisites**: Node 20+, npm, Java 21 and Docker only if we later stand up the planned backend contract target
- **Frontend dev**: `cd frontend && npm install && npm run dev`
- **Frontend build**: `cd frontend && npm run build`
- **Storybook**: `cd frontend && npm run storybook`
- **Future backend contract target**: `cd backend && ./mvnw spring-boot:run`
- **Future OpenAPI surface**: `/v3/api-docs` with Swagger UI at `/swagger-ui.html`
