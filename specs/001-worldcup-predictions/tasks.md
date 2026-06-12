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
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Test-first implementation is required by the project constitution. Write failing tests before feature code in each story phase.

**Organization**: Tasks are grouped by user story so each story remains independently testable and shippable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this belongs to (`US1`, `US2`, `US3`, `US4`, `US5`, `US6`)
- Every task below includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare Supabase-backed development, test harness updates, and feature module boundaries for live tournament behavior.

- [ ] T001 Update frontend dependencies and scripts for Supabase-backed auth, persistence, and leaderboard testing in `frontend/package.json` and `frontend/package-lock.json`
- [ ] T002 Configure test harness and shared environment setup for time-sensitive lock and auth-aware tests in `frontend/vitest.config.ts`, `frontend/playwright.config.ts`, `frontend/src/test/setup.ts`, and `frontend/tsconfig.app.json`
- [ ] T003 [P] Establish shared module entry points for auth, result comparison, leaderboard, and persistence helpers in `frontend/src/engine/index.ts`, `frontend/src/features/predictions/index.ts`, `frontend/src/persistence/index.ts`, and `frontend/src/types/index.ts`
- [ ] T004 [P] Update environment templates and setup docs for Supabase configuration in `frontend/.env.example` and `specs/001-worldcup-predictions/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the domain model, Supabase data boundaries, and shared lock/scoring primitives that every story depends on.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [ ] T005 [P] Extend shared Zod schemas and types for profiles, public participation, match results, lock state, and leaderboard entries in `frontend/src/types/tournament.ts` and `frontend/src/types/prediction.ts`
- [ ] T006 [P] Extend seeded tournament data and timing helpers for lock-state derivation and completed-match comparison in `frontend/src/data/tournament2026.ts` and `frontend/src/lib/matchTime.ts`
- [ ] T007 Write failing foundational tests for lock timing, official-result scoring, remote-session selection, and public leaderboard-safe mapping in `frontend/tests/unit/engine/tournamentEngine.test.ts` and `frontend/tests/unit/persistence/predictionStorage.test.ts`
- [ ] T008 Implement pure helpers for lock-state derivation, completed-match status, and score calculation in `frontend/src/engine/scoring.ts`, `frontend/src/engine/validation.ts`, and `frontend/src/engine/index.ts`
- [ ] T009 Implement shared Supabase profile/result persistence helpers and merge logic in `frontend/src/persistence/predictionCloudStorage.ts`, `frontend/src/persistence/predictionStorage.ts`, and `frontend/src/lib/supabase.ts`

**Checkpoint**: The app has a stable shared model for auth-backed prediction state, official results, lock timing, and leaderboard scoring.

---

## Phase 3: User Story 1 - Build and Lock My Tournament Prediction (Priority: P1) 🎯 MVP

**Goal**: Let a user predict every tournament match, see live bracket progression, and have each match become read-only 1 hour before kickoff.

**Independent Test**: Start a session, enter predictions before kickoff, confirm standings and bracket update, then simulate the lock threshold and verify the same match becomes non-editable while remaining visible.

### Tests for User Story 1

- [ ] T010 [P] [US1] Write failing interaction tests for score entry, tie resolution, and match lock transitions in `frontend/tests/integration/prediction-workspace.test.tsx`
- [ ] T011 [P] [US1] Write a failing end-to-end flow covering prediction entry before lock and read-only behavior after the 1-hour threshold in `frontend/tests/integration/prediction-workspace.spec.ts`

### Implementation for User Story 1

- [ ] T012 [P] [US1] Update score entry and advancement inputs for locked, in-progress, and read-only states in `frontend/src/features/predictions/components/ScoreInput.tsx` and `frontend/src/features/predictions/components/AdvancementPicker.tsx`
- [ ] T013 [P] [US1] Update standings and knockout projections to consume locked-match display state in `frontend/src/features/predictions/components/GroupStandingsPanel.tsx` and `frontend/src/features/predictions/components/KnockoutBracketView.tsx`
- [ ] T014 [US1] Implement lock-aware session orchestration and view-state derivation in `frontend/src/features/predictions/usePredictionSession.ts` and `frontend/src/features/predictions/PredictionWorkspace.tsx`
- [ ] T015 [US1] Update workspace copy, status banners, and schedule/fixture state labels for open vs locked matches in `frontend/src/features/predictions/components/PredictionStatusBanner.tsx` and `frontend/src/index.css`

**Checkpoint**: User Story 1 is independently testable and predictions reliably lock before kickoff.

---

## Phase 4: User Story 6 - Record Official Match Results Daily (Priority: P1)

**Goal**: Let official results entered in Supabase become the source of truth for completed-match state and downstream score calculation.

**Independent Test**: Add or update official result rows for one day of matches and verify the app reflects them after reload without code changes.

### Tests for User Story 6

- [ ] T016 [P] [US6] Write failing unit and integration coverage for official-result fetch, pending-result state, and knockout advancing-team validation in `frontend/tests/unit/engine/tournamentEngine.test.ts` and `frontend/tests/integration/prediction-workspace.test.tsx`

### Implementation for User Story 6

- [ ] T017 [P] [US6] Implement official-result fetch and normalization helpers in `frontend/src/persistence/predictionCloudStorage.ts` and `frontend/src/types/tournament.ts`
- [ ] T018 [P] [US6] Thread official result data into match rendering and completed-match state derivation in `frontend/src/features/predictions/usePredictionSession.ts` and `frontend/src/features/predictions/PredictionWorkspace.tsx`
- [ ] T019 [US6] Document the Supabase table shape, organizer update flow, and validation expectations in `specs/001-worldcup-predictions/quickstart.md` and `specs/001-worldcup-predictions/data-model.md`

**Checkpoint**: Official results from Supabase are visible in the app and can drive completed-match behavior.

---

## Phase 5: User Story 4 - Compare My Predictions With Official Results (Priority: P2)

**Goal**: Let users see official final scores beside their locked predictions and understand the points earned per completed match plus their cumulative total.

**Independent Test**: Load a user with completed-match results and verify the comparison view shows prediction vs official score, earned points, and updated totals.

### Tests for User Story 4

- [ ] T020 [P] [US4] Write failing scoring and comparison UI tests for completed matches in `frontend/tests/unit/engine/tournamentEngine.test.ts` and `frontend/tests/integration/prediction-workspace.test.tsx`

### Implementation for User Story 4

- [ ] T021 [P] [US4] Build completed-match comparison and earned-points display states in `frontend/src/features/predictions/components/ScoreInput.tsx` and `frontend/src/features/predictions/PredictionWorkspace.tsx`
- [ ] T022 [P] [US4] Extend scoring summary helpers and cumulative score presentation in `frontend/src/engine/scoring.ts` and `frontend/src/features/predictions/PredictionWorkspace.tsx`
- [ ] T023 [US4] Update shared styles for official-result comparison, pending-result states, and earned-point badges in `frontend/src/index.css`

**Checkpoint**: Users can compare their predictions against official results and understand scoring without needing the leaderboard.

---

## Phase 6: User Story 5 - Join a Public Leaderboard (Priority: P2)

**Goal**: Let users set a public display name, choose whether to appear publicly, and compare cumulative scores on a public leaderboard.

**Independent Test**: Create multiple users with public profiles and scored matches, then verify the leaderboard ranks them correctly and hides private identifiers.

### Tests for User Story 5

- [ ] T024 [P] [US5] Write failing tests for display-name editing, public participation preference, and leaderboard ranking in `frontend/tests/integration/personalization.test.tsx` and `frontend/tests/integration/prediction-workspace.test.tsx`
- [ ] T025 [P] [US5] Write a failing end-to-end leaderboard flow for signed-in users with public profiles in `frontend/tests/integration/accessibility.spec.ts` and `frontend/tests/integration/prediction-workspace.spec.ts`

### Implementation for User Story 5

- [ ] T026 [P] [US5] Implement profile fetch/save helpers and public-safe leaderboard mapping in `frontend/src/persistence/predictionCloudStorage.ts` and `frontend/src/hooks/useSupabaseAuth.ts`
- [ ] T027 [P] [US5] Build display-name and public participation controls in `frontend/src/features/predictions/components/PersonalizationPanel.tsx` and `frontend/src/features/predictions/components/CloudSyncPanel.tsx`
- [ ] T028 [P] [US5] Build public leaderboard UI and cumulative ranking display in `frontend/src/features/predictions/components/PredictionToolbar.tsx` and `frontend/src/features/predictions/PredictionWorkspace.tsx`
- [ ] T029 [US5] Remove internal platform wording from account/save copy and align public-facing text with product language in `frontend/src/features/predictions/components/CloudSyncPanel.tsx` and `frontend/src/index.css`

**Checkpoint**: Public leaderboard participation works with display names and does not expose private account data.

---

## Phase 7: User Story 2 - Export Prediction as an Image (Priority: P3)

**Goal**: Preserve polished PNG export while keeping it consistent with the new account-backed, lock-aware prediction state.

**Independent Test**: Load a valid prediction with live-tournament state present, open export, verify preview fidelity, and download the PNG successfully.

### Tests for User Story 2

- [ ] T030 [P] [US2] Refresh export tests for lock-aware and result-aware prediction sessions in `frontend/tests/unit/export/exportPredictionCard.test.ts` and `frontend/tests/integration/export-studio.test.tsx`

### Implementation for User Story 2

- [ ] T031 [P] [US2] Update export model generation for the current prediction/session structure in `frontend/src/features/predictions/export/buildExportModel.ts` and `frontend/src/features/predictions/export/exportPredictionCard.ts`
- [ ] T032 [P] [US2] Update export studio gating and preview behavior for the new session model in `frontend/src/features/predictions/components/ExportStudio.tsx` and `frontend/src/features/predictions/components/ExportActions.tsx`
- [ ] T033 [US2] Keep preview and export card rendering aligned with the updated personalized state in `frontend/src/components/organisms/ExportPreviewCard.tsx` and `frontend/src/features/predictions/PredictionWorkspace.tsx`

**Checkpoint**: Export remains independently testable after the live-tournament feature expansion.

---

## Phase 8: User Story 3 - Personalize and Revisit My Prediction (Priority: P3)

**Goal**: Preserve personalization and resume behavior while shifting the primary restore path to signed-in multi-device usage with local fallback.

**Independent Test**: Personalize title/theme/display identity, sign out and back in on another browser context, and confirm the draft restores correctly.

### Tests for User Story 3

- [ ] T034 [P] [US3] Refresh persistence and personalization tests for local cache plus remote restore in `frontend/tests/unit/persistence/predictionSessionResume.test.ts` and `frontend/tests/integration/personalization.test.tsx`

### Implementation for User Story 3

- [ ] T035 [P] [US3] Update session restore and merge logic for local cache plus remote account state in `frontend/src/features/predictions/usePredictionSession.ts` and `frontend/src/persistence/predictionStorage.ts`
- [ ] T036 [P] [US3] Keep personalization controls and preview bindings aligned with the remote session model in `frontend/src/features/predictions/components/PersonalizationPanel.tsx` and `frontend/src/components/organisms/ExportPreviewCard.tsx`
- [ ] T037 [US3] Update draft restore messaging and reset behavior for signed-in and signed-out users in `frontend/src/features/predictions/components/CloudSyncPanel.tsx` and `frontend/src/features/predictions/PredictionWorkspace.tsx`

**Checkpoint**: Personalization and resume remain independently testable in the new account-backed architecture.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final accessibility, responsive, and release-quality cleanup across all stories.

- [ ] T038 [P] Expand Storybook coverage for locked matches, completed-match comparisons, leaderboard states, and account flows in `frontend/src/components/organisms/ExportPreviewCard.stories.tsx`, `frontend/src/components/organisms/SettingsPanel.stories.tsx`, and `frontend/src/components/molecules/MatchScoreCard.stories.tsx`
- [ ] T039 [P] Add accessibility and keyboard-flow regression coverage for locked states, leaderboard controls, and account flows in `frontend/tests/integration/accessibility.spec.ts` and `frontend/src/features/predictions/components/ScoreInput.tsx`
- [ ] T040 [P] Optimize result refresh, lock-state recalculation, and leaderboard render responsiveness in `frontend/src/features/predictions/usePredictionSession.ts`, `frontend/src/features/predictions/PredictionWorkspace.tsx`, and `frontend/src/persistence/predictionCloudStorage.ts`
- [ ] T041 Update final QA and release validation instructions for live tournament operation in `frontend/package.json` and `specs/001-worldcup-predictions/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup** has no dependencies and can start immediately.
- **Phase 2: Foundational** depends on Phase 1 and blocks all story work.
- **Phase 3: US1** depends on Phase 2 and establishes lock-aware authoring.
- **Phase 4: US6** depends on Phase 2 and should land before result comparison and leaderboard work.
- **Phase 5: US4** depends on US1 and US6 because comparison requires both locked predictions and official results.
- **Phase 6: US5** depends on US4 because leaderboard ranking requires completed-match scoring.
- **Phase 7: US2** depends on US1 and should be refreshed after the new session model settles.
- **Phase 8: US3** depends on Phase 2 and overlaps with US5 once remote persistence behavior is stable.
- **Phase 9: Polish** depends on the desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories once the foundation is ready.
- **US6 (P1)**: No dependency on other stories once the foundation is ready.
- **US4 (P2)**: Depends on US1 + US6.
- **US5 (P2)**: Depends on US4 and the auth/profile foundation.
- **US2 (P3)**: Depends on US1 and should be adjusted after the new session model stabilizes.
- **US3 (P3)**: Depends on the auth/persistence foundation and overlaps with US5.

### Within Each User Story

- Tests must be written and fail before implementation tasks begin.
- Shared data and state primitives come before composed UI wiring.
- User-facing copy cleanup comes after functional behavior is in place.
- Each story ends at its checkpoint before the next dependent story is accepted.

### Parallel Opportunities

- `T003`, `T004`, `T005`, `T006`, `T012`, `T013`, `T017`, `T021`, `T026`, `T027`, `T031`, `T035`, `T038`, `T039`, and `T040` can run in parallel within their phases when file ownership does not overlap.
- US3 and US2 refresh work can proceed once the shared session model is stable, even while leaderboard UI is still being finished.

---

## Parallel Example: User Story 1

```bash
# Launch failing tests for prediction entry and lock behavior together:
Task: "T010 Write failing interaction tests for score entry, tie resolution, and match lock transitions in frontend/tests/integration/prediction-workspace.test.tsx"
Task: "T011 Write a failing end-to-end flow covering prediction entry before lock and read-only behavior after the 1-hour threshold in frontend/tests/integration/prediction-workspace.spec.ts"

# Build input and derived projection views in parallel:
Task: "T012 Update score entry and advancement inputs for locked, in-progress, and read-only states in frontend/src/features/predictions/components/ScoreInput.tsx and frontend/src/features/predictions/components/AdvancementPicker.tsx"
Task: "T013 Update standings and knockout projections to consume locked-match display state in frontend/src/features/predictions/components/GroupStandingsPanel.tsx and frontend/src/features/predictions/components/KnockoutBracketView.tsx"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 6
5. Validate locked authoring plus official-result ingestion before layering public competition

### Incremental Delivery

1. Ship lock-aware prediction authoring first
2. Add official results and per-user scoring second
3. Add public leaderboard and display-name participation third
4. Refresh export and personalization around the new account-backed model last

### Parallel Team Strategy

1. One developer owns shared model/auth/persistence foundations until the session and result boundaries stabilize
2. Once official results are visible in the app, scoring/comparison and leaderboard/profile work can split
3. Export refresh and personalization restore can run in parallel after the new session model is stable

---

## Notes

- All task descriptions use exact file paths and preserve story traceability.
- Tests are intentionally included because the project constitution requires test-first implementation and minimum coverage.
- The suggested MVP scope for the revised product is **User Story 1 + User Story 6**.
