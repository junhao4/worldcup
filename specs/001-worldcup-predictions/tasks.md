<!-- D2:BEGIN_PHASE_SUBAGENT_TASKS_POINTER -->

## D2 Sequential Phase Subagent Tasks

Before `/speckit-implement` executes tasks, read `d2/subagent-tasks.md` and use it as the implementation orchestration guide.

D2 mode:
- KB retrieval is mandatory per code task 
- each phase subagent MUST read `.specify/memory/kb/kb-routing.md` before querying KB
- every routing decision must be logged
- the main implement agent MUST NOT preload best-practice files, policy files, or KB results
- if main agent implements code or queries KB when subagents can do it, all code is **INVALID**!!

<!-- D2:END_PHASE_SUBAGENT_TASKS_POINTER -->

# Tasks: World Cup Prediction Website

**Input**: Design documents from `/specs/001-worldcup-predictions/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/worldcup-predictions.openapi.yaml, quickstart.md

**Tests**: Test-first implementation is required by the project constitution. Write failing tests before feature code in each story phase.

**Organization**: Tasks are grouped by user story so each story remains independently testable and shippable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`US1`, `US2`, `US3`)
- Every task below includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the frontend toolchain, test runners, and feature module boundaries.

- [X] T001 Update feature dependencies and scripts for testing and export in `frontend/package.json` and `frontend/package-lock.json`
- [X] T002 Configure the frontend test harness in `frontend/vitest.config.ts`, `frontend/playwright.config.ts`, `frontend/src/test/setup.ts`, and `frontend/tsconfig.app.json`
- [X] T003 [P] Create feature module entry points in `frontend/src/engine/index.ts`, `frontend/src/features/predictions/index.ts`, `frontend/src/persistence/index.ts`, and `frontend/src/types/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the contract-aligned domain model, tournament seed data, and core engine/persistence primitives that every story depends on.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [X] T004 [P] Define contract-aligned Zod schemas and shared types in `frontend/src/types/tournament.ts` and `frontend/src/types/prediction.ts`
- [X] T005 [P] Seed the full 2026 tournament structure and export themes in `frontend/src/data/tournament2026.ts` and `frontend/src/data/predictionThemes.ts`
- [X] T006 Write failing foundational tests for standings, advancement, tie resolution, and storage migration in `frontend/tests/unit/engine/tournamentEngine.test.ts` and `frontend/tests/unit/persistence/predictionStorage.test.ts`
- [X] T007 Implement pure tournament calculation and validation modules in `frontend/src/engine/standings.ts`, `frontend/src/engine/bracket.ts`, `frontend/src/engine/validation.ts`, and `frontend/src/engine/index.ts`
- [X] T008 Implement versioned browser persistence and session hydration helpers in `frontend/src/persistence/predictionStorage.ts` and `frontend/src/persistence/predictionMigrations.ts`

**Checkpoint**: The data model, seed data, engine, and persistence layer are ready for story-level UI work.

---

## Phase 3: User Story 1 - Build My Tournament Prediction (Priority: P1) 🎯 MVP

**Goal**: Let a user predict scores for every tournament match, see live standings and bracket progression, and resolve knockout ties correctly.

**Independent Test**: Start a fresh session, enter group and knockout scores, choose advancing teams for tied knockout matches, and verify the live standings plus champion path update without using export or personalization.

### Tests for User Story 1

- [X] T009 [P] [US1] Write failing interaction tests for score entry, standings updates, and knockout winner prompts in `frontend/tests/integration/prediction-workspace.test.tsx`
- [X] T010 [P] [US1] Write a failing MVP end-to-end flow for completing predictions through a champion result in `frontend/tests/integration/prediction-workspace.spec.ts`

### Implementation for User Story 1

- [X] T011 [P] [US1] Build per-match score and advancement inputs in `frontend/src/features/predictions/components/ScoreInput.tsx` and `frontend/src/features/predictions/components/AdvancementPicker.tsx`
- [X] T012 [P] [US1] Build derived standings and knockout projection views in `frontend/src/features/predictions/components/GroupStandingsPanel.tsx` and `frontend/src/features/predictions/components/KnockoutBracketView.tsx`
- [X] T013 [US1] Implement prediction session state orchestration in `frontend/src/features/predictions/usePredictionSession.ts` and `frontend/src/features/predictions/PredictionWorkspace.tsx`
- [X] T014 [US1] Wire the live prediction workspace into `frontend/src/App.tsx`, `frontend/src/components/organisms/StandingsTable.tsx`, and `frontend/src/components/molecules/MatchScoreCard.tsx`
- [X] T015 [US1] Add missing-selection, downstream reset, and invalid-tie feedback in `frontend/src/features/predictions/components/PredictionStatusBanner.tsx` and `frontend/src/index.css`

**Checkpoint**: User Story 1 should now be fully functional and independently testable as the MVP.

---

## Phase 4: User Story 2 - Export Prediction as an Image (Priority: P2)

**Goal**: Let a user preview a polished prediction card and export one downloadable PNG only when the tournament prediction is complete and valid.

**Independent Test**: Load a completed prediction, open the export view, verify the preview matches the current results, and download a PNG that includes the title, route, and champion. Confirm incomplete predictions are blocked.

### Tests for User Story 2

- [X] T016 [P] [US2] Write failing export tests for completion gating, preview fidelity, and download naming in `frontend/tests/unit/export/exportPredictionCard.test.ts` and `frontend/tests/integration/export-studio.test.tsx`

### Implementation for User Story 2

- [X] T017 [P] [US2] Create export model and PNG generation helpers in `frontend/src/features/predictions/export/buildExportModel.ts` and `frontend/src/features/predictions/export/exportPredictionCard.ts`
- [X] T018 [P] [US2] Build the export studio and action states in `frontend/src/features/predictions/components/ExportStudio.tsx` and `frontend/src/features/predictions/components/ExportActions.tsx`
- [X] T019 [US2] Connect valid-session export gating and preview/download flow in `frontend/src/features/predictions/PredictionWorkspace.tsx` and `frontend/src/components/organisms/ExportPreviewCard.tsx`
- [X] T020 [US2] Add export loading, failure, and success feedback copy in `frontend/src/features/predictions/components/ExportActions.tsx` and `frontend/src/components/molecules/InfoTile.tsx`

**Checkpoint**: User Story 2 should be independently testable on top of a valid prediction session.

---

## Phase 5: User Story 3 - Personalize and Revisit My Prediction (Priority: P3)

**Goal**: Let a user personalize the prediction card, resume their in-progress work on the same device, and keep preview plus export output in sync with those preferences.

**Independent Test**: Customize the title and theme, refresh or reopen the app on the same device, confirm the draft restores correctly, and verify the preview reflects the restored personalization before export.

### Tests for User Story 3

- [X] T021 [P] [US3] Write failing resume and personalization tests for session restore, migration, title editing, and theme sync in `frontend/tests/unit/persistence/predictionSessionResume.test.ts` and `frontend/tests/integration/personalization.test.tsx`

### Implementation for User Story 3

- [X] T022 [P] [US3] Build personalization controls and draft metadata editing in `frontend/src/features/predictions/components/PersonalizationPanel.tsx` and `frontend/src/features/predictions/components/PredictionToolbar.tsx`
- [X] T023 [P] [US3] Extend session schema and storage serialization for card metadata in `frontend/src/types/prediction.ts` and `frontend/src/persistence/predictionStorage.ts`
- [X] T024 [US3] Implement auto-save, restore, and reset actions in `frontend/src/features/predictions/usePredictionSession.ts` and `frontend/src/features/predictions/PredictionWorkspace.tsx`
- [X] T025 [US3] Bind personalized title, creator name, and theme choices across `frontend/src/components/organisms/SettingsPanel.tsx`, `frontend/src/components/atoms/ThemeSwatch.tsx`, and `frontend/src/components/organisms/ExportPreviewCard.tsx`

**Checkpoint**: User Story 3 should restore and personalize a draft independently on the same device.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final accessibility, responsive, Storybook, and release-quality cleanup across all stories.

- [X] T026 [P] Expand Storybook coverage for live prediction, export, and personalization states in `frontend/src/components/organisms/ExportPreviewCard.stories.tsx`, `frontend/src/components/organisms/SettingsPanel.stories.tsx`, and `frontend/src/components/molecules/MatchScoreCard.stories.tsx`
- [X] T027 [P] Add accessibility and keyboard-flow regression coverage in `frontend/tests/integration/accessibility.spec.ts` and `frontend/src/features/predictions/components/ScoreInput.tsx`
- [X] T028 [P] Optimize non-urgent recalculation and save responsiveness in `frontend/src/features/predictions/usePredictionSession.ts` and `frontend/src/features/predictions/PredictionWorkspace.tsx`
- [X] T029 Update final validation and QA instructions in `frontend/package.json` and `specs/001-worldcup-predictions/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies and can start immediately.
- **Phase 2: Foundational** depends on Phase 1 and blocks all user story work.
- **Phase 3: User Story 1** depends on Phase 2 and establishes the interactive prediction workflow that later stories build on.
- **Phase 4: User Story 2** depends on Phase 3 because export requires a valid completed prediction and the live session controller.
- **Phase 5: User Story 3** depends on Phase 3 and can overlap late with Phase 4 once session state is stable.
- **Phase 6: Polish** depends on the desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories once the foundation is ready.
- **US2 (P2)**: Depends on US1 because export gating and preview data come from the live validated session.
- **US3 (P3)**: Depends on US1 for session state and integrates with US2 preview bindings, but remains independently testable as same-device draft restore plus personalization.

### Within Each User Story

- Tests must be written and fail before implementation tasks begin.
- Data and state primitives come before composed UI wiring.
- Shared component adaptation comes after the story controller logic is in place.
- Each story ends at its checkpoint before the next dependent story is accepted.

### Parallel Opportunities

- `T003`, `T004`, `T005`, `T011`, `T012`, `T017`, `T018`, `T022`, `T023`, `T026`, `T027`, and `T028` can run in parallel within their phases.
- US3 can begin once the Phase 3 session controller is stable, even if US2 export work is still in progress.
- Storybook and accessibility polish can proceed in parallel after the core story implementations settle.

---

## Parallel Example: User Story 1

```bash
# Launch failing tests for the MVP flow together:
Task: "T009 Write failing interaction tests for score entry, standings updates, and knockout winner prompts in frontend/tests/integration/prediction-workspace.test.tsx"
Task: "T010 Write a failing MVP end-to-end flow for completing predictions through a champion result in frontend/tests/integration/prediction-workspace.spec.ts"

# Build the two main visual projections in parallel:
Task: "T011 Build per-match score and advancement inputs in frontend/src/features/predictions/components/ScoreInput.tsx and frontend/src/features/predictions/components/AdvancementPicker.tsx"
Task: "T012 Build derived standings and knockout projection views in frontend/src/features/predictions/components/GroupStandingsPanel.tsx and frontend/src/features/predictions/components/KnockoutBracketView.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate the MVP with `npm run build`, the US1 test suite, and the independent story checkpoint

### Incremental Delivery

1. Ship the prediction workflow first as the core tournament experience
2. Add the polished PNG export flow once a valid session exists end to end
3. Add draft restore and personalization last so it hardens the finished workflow instead of blocking the MVP

### Parallel Team Strategy

1. One developer owns Setup plus Foundational tasks until the engine and persistence layer stabilize
2. After US1 state orchestration is in place, export and personalization work can split across different implementers
3. Final polish can run in parallel across Storybook, accessibility, and responsiveness

---

## Notes

- All task descriptions use exact file paths and preserve story traceability.
- Tests are intentionally included because the project constitution requires test-first implementation and minimum coverage.
- The suggested MVP scope is **User Story 1 only**.
