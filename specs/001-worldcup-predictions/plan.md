# Implementation Plan: World Cup Prediction Website

**Branch**: `001-worldcup-predictions` | **Date**: 2026-06-10 | **Spec**: [spec.md](/Users/JunHao/Documents/work/uispeckit/tests/test11-autoskills/specs/001-worldcup-predictions/spec.md)
**Input**: Feature specification from `/specs/001-worldcup-predictions/spec.md`

## Summary

Build a React 19 + TypeScript + Vite web app that supports full 2026 World Cup score predictions, live standings and knockout progression, same-device resume, and polished PNG export. The implementation will stay frontend-first for the core flow, using a pure tournament engine, versioned browser persistence, and a dedicated export surface, while defining an OpenAPI contract for future backend sync or hosted export parity.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Vite 6  
**Primary Dependencies**: React, React DOM, Vite, lucide-react, class-variance-authority, clsx, tailwind-merge, Storybook; planned feature additions: Vitest, React Testing Library, Playwright, Zod, html-to-image, and selective TanStack packages where they materially reduce complexity  
**Storage**: Browser `localStorage` with a versioned minimal snapshot; static tournament seed data in frontend source; future backend persistence covered by contract only  
**Testing**: Vitest for engine and component logic, React Testing Library for interaction tests, Playwright for end-to-end prediction and export flows, `npm run build` as a release gate  
**Target Platform**: Modern desktop and mobile browsers on evergreen Chromium, Safari, and Firefox  
**Project Type**: Web application  
**Performance Goals**: Initial interactive load under 2 seconds on a warmed local dev build, standings and bracket recompute under 50ms for a single score edit, PNG export generation under 2 seconds for the default prediction card  
**Constraints**: Must work without account creation, must preserve progress on the same device, must block invalid export states, must meet WCAG 2.1 AA, and must avoid storing unnecessary or sensitive data in browser persistence  
**Scale/Scope**: One full 2026 tournament model with 48 teams, 12 groups, 104 matches, one active prediction session per browser profile in v1, and one polished export card variant

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality**: PASS. The design separates tournament rules, persistence, export, and UI composition into focused modules so functions and components can stay small and single-purpose.
- **Testing Standards**: PASS WITH REQUIRED WORK. Implementation must start with failing unit tests for standings, advancement, knockout tie handling, persistence restore, and export gating before feature code is added.
- **User Experience**: PASS. The plan includes explicit loading, error, empty, invalid, and reset states across score entry, resume, preview, and export flows.
- **Performance**: PASS. Tournament outcomes will be derived from current prediction state rather than duplicated state, with versioned minimal storage snapshots and non-urgent UI updates eligible for `startTransition`.
- **Development Environment**: PASS. Core functionality is frontend-local with deterministic seed data and no production secrets required.
- **Security and Compliance**: PASS. No credentials or sensitive data are required for v1, and persistence will store only prediction inputs and display preferences.

**Post-Design Re-Check**: PASS. Phase 1 artifacts keep the architecture frontend-first, contract-aware, accessible, and testable without introducing unjustified complexity.

## Project Structure

### Documentation (this feature)

```text
specs/001-worldcup-predictions/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── worldcup-predictions.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   ├── data/
│   ├── engine/
│   ├── features/
│   │   └── predictions/
│   ├── hooks/
│   ├── lib/
│   ├── persistence/
│   ├── test/
│   └── types/
├── resources/
└── tests/
    ├── integration/
    └── unit/

backend/
└── docs-only contract target for future sync/export parity
```

**Structure Decision**: Use the existing `frontend/` app as the delivery vehicle for v1, expanding it with `engine`, `features/predictions`, `persistence`, `types`, and test folders. The `backend/` path is reserved only by the plan and contract so the frontend can remain decoupled from a future Spring Boot service.

## Phase 0: Research Output

- Confirm the 2026 tournament model as static seed data plus deterministic progression rules.
- Use pure functions to compute standings, best-third outcomes, knockout participants, and champion from current score inputs.
- Persist only the minimum user-authored data required to restore the session, with key versioning and defensive parse failure handling.
- Use a client-side export pipeline around a dedicated prediction card surface so the preview and PNG remain visually aligned.
- Adopt a test strategy that satisfies the constitution before implementation begins.

## Phase 1: Design Output

- Define a data model for tournament seed data, user prediction inputs, knockout advancement decisions, export presentation, and persistence snapshots.
- Define a contract that supports future tournament retrieval, validation, save/load, and export operations even if v1 stays browser-local.
- Document a quickstart that lets us run the frontend, validate the build, exercise Storybook, and understand the future backend boundary.

## Complexity Tracking

No constitution violations currently require justification.

## Fullstack Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TanStack (Form / Query / Router / Table) |
| Backend | Spring Boot 4.x + Java 21 |
| Contract | OpenAPI 3.1 — single source of truth between FE and BE |

### Source Code Layout

```text
frontend/    React 19 + Vite + TanStack
backend/     Spring Boot 4.x + Java 21
```

## OpenAPI 3.1 Contract

```yaml
openapi: "3.1.0"
info:
  title: World Cup Prediction Website
  version: "0.1.0"
servers:
  - url: http://localhost:8080
paths:
  /api/tournaments/2026-world-cup:
    get:
      summary: Get the seeded 2026 World Cup structure
      operationId: getTournament
      responses:
        "200":
          description: Tournament seed data
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Tournament"
  /api/predictions/validate:
    post:
      summary: Validate a prediction snapshot and derive standings plus bracket state
      operationId: validatePrediction
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PredictionSession"
      responses:
        "200":
          description: Validation result with derived tournament state
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PredictionValidationResult"
  /api/predictions:
    post:
      summary: Save a prediction session
      operationId: createPrediction
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PredictionSession"
      responses:
        "201":
          description: Prediction saved
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PredictionSession"
  /api/predictions/{predictionId}:
    get:
      summary: Load a saved prediction session
      operationId: getPrediction
      parameters:
        - in: path
          name: predictionId
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Saved prediction session
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PredictionSession"
    put:
      summary: Update a saved prediction session
      operationId: updatePrediction
      parameters:
        - in: path
          name: predictionId
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PredictionSession"
      responses:
        "200":
          description: Updated prediction session
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PredictionSession"
  /api/predictions/{predictionId}/export:
    post:
      summary: Generate export metadata for a completed prediction
      operationId: exportPrediction
      parameters:
        - in: path
          name: predictionId
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Export descriptor
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ExportImage"
components:
  schemas:
    Team:
      type: object
      required: [id, name, fifaCode, confederation]
      properties:
        id:
          type: string
        name:
          type: string
        fifaCode:
          type: string
        confederation:
          type: string
    Match:
      type: object
      required: [id, stage, roundOrder, homeTeamId, awayTeamId]
      properties:
        id:
          type: string
        stage:
          type: string
        roundOrder:
          type: integer
        groupId:
          type: string
          nullable: true
        homeTeamId:
          type: string
        awayTeamId:
          type: string
        knockout:
          type: boolean
    Tournament:
      type: object
      required: [id, name, year, teams, matches]
      properties:
        id:
          type: string
        name:
          type: string
        year:
          type: integer
        teams:
          type: array
          items:
            $ref: "#/components/schemas/Team"
        matches:
          type: array
          items:
            $ref: "#/components/schemas/Match"
    MatchPrediction:
      type: object
      required: [matchId, homeScore, awayScore]
      properties:
        matchId:
          type: string
        homeScore:
          type: integer
          minimum: 0
        awayScore:
          type: integer
          minimum: 0
        advancingTeamId:
          type: string
          nullable: true
    PredictionCard:
      type: object
      required: [title, themeId]
      properties:
        title:
          type: string
        creatorName:
          type: string
          nullable: true
        themeId:
          type: string
    PredictionSession:
      type: object
      required: [id, tournamentId, predictions, card]
      properties:
        id:
          type: string
        tournamentId:
          type: string
        predictions:
          type: array
          items:
            $ref: "#/components/schemas/MatchPrediction"
        card:
          $ref: "#/components/schemas/PredictionCard"
        updatedAt:
          type: string
          format: date-time
    PredictionValidationResult:
      type: object
      required: [complete, valid, championTeamId, missingMatchIds]
      properties:
        complete:
          type: boolean
        valid:
          type: boolean
        championTeamId:
          type: string
          nullable: true
        missingMatchIds:
          type: array
          items:
            type: string
        resetMatchIds:
          type: array
          items:
            type: string
        messages:
          type: array
          items:
            type: string
    ExportImage:
      type: object
      required: [status, fileName, width, height]
      properties:
        status:
          type: string
          enum: [ready]
        fileName:
          type: string
        width:
          type: integer
        height:
          type: integer
        dataUrl:
          type: string
          nullable: true
```
