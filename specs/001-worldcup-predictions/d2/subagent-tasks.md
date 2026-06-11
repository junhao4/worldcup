# D2 Sequential Phase Subagent Implementation Tasks

## Purpose

This file guides `/speckit-implement`. Use one phase-scoped subagent that queries the KB at a time. The source of truth for task completion remains `tasks.md`.

## Execution Rule

Phases are sequential — only one KB-querying phase subagent runs at a time. Do not start the next phase until the current one has:
(1) routed KB queries using `.specify/memory/kb/kb-routing.md`,
(2) queried the selected KB context(s),
(3) completed or reported a blocker,
(4) returned its summary,
(5) had its diff reviewed,
(6) had validation run,
(7) had completed tasks marked `[X]` in `tasks.md`,
(8) had an entry appended to `d2/implementation-log.md`.

Each phase uses a two-pass pipeline:
- Pass 1 (Implementer): inspects the task/code, routes KB queries, queries KB before writing, writes code, and logs routing plus KB evidence.
- Pass 2 (Reviewer): independently inspects final code, routes KB queries again, audits the Implementer routing, and checks code against KB evidence, fixes MUST-FIX issues, and logs reviewer audit plus fix evidence.

The phase is only accepted when the Reviewer reports `0` MUST-FIX violations.

## Phase Splitting Rule

If a phase has more than 5 tasks, split it into sub-phases of at most 5 tasks each. Prefer splitting between tests and implementation tasks, and keep same-file work together.

## Main Implement Agent Role

The main implement agent is only the orchestrator. It reads `tasks.md` and `d2/subagent-tasks.md`, and MUST NOT preload best-practice files, policy files, KB results, unrelated user-story design sections, `spec.md`, `research.md`, or `constitution.md`. It spawns one phase subagent, waits, verifies the log, reviews the diff, runs validation, marks accepted tasks, then continues.

### Main Agent Enforcement

After each KB-querying phase subagent returns, verify it returned `Log appended: yes` and `Log location: d2/implementation-log.md`. If a non-Setup phase's diff touches `package.json`, `package-lock.json`, or `pom.xml`, or a task has no reason for not querying the KB yet has no KB query associated with it, reject the phase.

## Phase Agent Index

### Phase 1: Setup

Agent ID pattern: `D2-PHASE-1-<timestamp>`
Tasks: `T001, T002, T003`

Task block:
- [ ] T001 Update feature dependencies and scripts for testing and export in `frontend/package.json` and `frontend/package-lock.json`
- [ ] T002 Configure the frontend test harness in `frontend/vitest.config.ts`, `frontend/playwright.config.ts`, `frontend/src/test/setup.ts`, and `frontend/tsconfig.app.json`
- [ ] T003 [P] Create feature module entry points in `frontend/src/engine/index.ts`, `frontend/src/features/predictions/index.ts`, `frontend/src/persistence/index.ts`, and `frontend/src/types/index.ts`

Allowed phase context:
- `specs/001-worldcup-predictions/tasks.md`
- `specs/001-worldcup-predictions/plan.md`
- `specs/001-worldcup-predictions/data-model.md`
- `specs/001-worldcup-predictions/quickstart.md`
- `specs/001-worldcup-predictions/contracts/worldcup-predictions.openapi.yaml`
- `frontend/package.json`
- `.specify/memory/kb/kb-routing.md`

### Phase 2: Foundational

Agent ID pattern: `D2-PHASE-2-<timestamp>`
Tasks: `T004, T005, T006, T007, T008`

Task block:
- [ ] T004 [P] Define contract-aligned Zod schemas and shared types in `frontend/src/types/tournament.ts` and `frontend/src/types/prediction.ts`
- [ ] T005 [P] Seed the full 2026 tournament structure and export themes in `frontend/src/data/tournament2026.ts` and `frontend/src/data/predictionThemes.ts`
- [ ] T006 Write failing foundational tests for standings, advancement, tie resolution, and storage migration in `frontend/tests/unit/engine/tournamentEngine.test.ts` and `frontend/tests/unit/persistence/predictionStorage.test.ts`
- [ ] T007 Implement pure tournament calculation and validation modules in `frontend/src/engine/standings.ts`, `frontend/src/engine/bracket.ts`, `frontend/src/engine/validation.ts`, and `frontend/src/engine/index.ts`
- [ ] T008 Implement versioned browser persistence and session hydration helpers in `frontend/src/persistence/predictionStorage.ts` and `frontend/src/persistence/predictionMigrations.ts`

Allowed phase context:
- `specs/001-worldcup-predictions/tasks.md`
- `specs/001-worldcup-predictions/plan.md`
- `specs/001-worldcup-predictions/data-model.md`
- `specs/001-worldcup-predictions/research.md`
- `specs/001-worldcup-predictions/quickstart.md`
- `specs/001-worldcup-predictions/contracts/worldcup-predictions.openapi.yaml`
- `frontend/package.json`
- `.specify/memory/kb/kb-routing.md`

### Phase 3a: User Story 1 — Tests and Views

Agent ID pattern: `D2-PHASE-3A-<timestamp>`
Tasks: `T009, T010, T011, T012`

Task block:
- [ ] T009 [P] [US1] Write failing interaction tests for score entry, standings updates, and knockout winner prompts in `frontend/tests/integration/prediction-workspace.test.tsx`
- [ ] T010 [P] [US1] Write a failing MVP end-to-end flow for completing predictions through a champion result in `frontend/tests/integration/prediction-workspace.spec.ts`
- [ ] T011 [P] [US1] Build per-match score and advancement inputs in `frontend/src/features/predictions/components/ScoreInput.tsx` and `frontend/src/features/predictions/components/AdvancementPicker.tsx`
- [ ] T012 [P] [US1] Build derived standings and knockout projection views in `frontend/src/features/predictions/components/GroupStandingsPanel.tsx` and `frontend/src/features/predictions/components/KnockoutBracketView.tsx`

Allowed phase context:
- `specs/001-worldcup-predictions/tasks.md`
- `specs/001-worldcup-predictions/plan.md`
- `specs/001-worldcup-predictions/data-model.md`
- `frontend/package.json`
- `frontend/src/components/`
- `frontend/src/data/`
- `frontend/src/engine/`
- `frontend/src/types/`
- `.specify/memory/kb/kb-routing.md`

### Phase 3b: User Story 1 — Integration

Agent ID pattern: `D2-PHASE-3B-<timestamp>`
Tasks: `T013, T014, T015`

Task block:
- [ ] T013 [US1] Implement prediction session state orchestration in `frontend/src/features/predictions/usePredictionSession.ts` and `frontend/src/features/predictions/PredictionWorkspace.tsx`
- [ ] T014 [US1] Wire the live prediction workspace into `frontend/src/App.tsx`, `frontend/src/components/organisms/StandingsTable.tsx`, and `frontend/src/components/molecules/MatchScoreCard.tsx`
- [ ] T015 [US1] Add missing-selection, downstream reset, and invalid-tie feedback in `frontend/src/features/predictions/components/PredictionStatusBanner.tsx` and `frontend/src/index.css`

Allowed phase context:
- `specs/001-worldcup-predictions/tasks.md`
- `specs/001-worldcup-predictions/plan.md`
- `specs/001-worldcup-predictions/data-model.md`
- `frontend/package.json`
- `frontend/src/components/`
- `frontend/src/data/`
- `frontend/src/engine/`
- `frontend/src/persistence/`
- `frontend/src/types/`
- `.specify/memory/kb/kb-routing.md`

### Phase 4: User Story 2 — Export

Agent ID pattern: `D2-PHASE-4-<timestamp>`
Tasks: `T016, T017, T018, T019, T020`

Task block:
- [ ] T016 [P] [US2] Write failing export tests for completion gating, preview fidelity, and download naming in `frontend/tests/unit/export/exportPredictionCard.test.ts` and `frontend/tests/integration/export-studio.test.tsx`
- [ ] T017 [P] [US2] Create export model and PNG generation helpers in `frontend/src/features/predictions/export/buildExportModel.ts` and `frontend/src/features/predictions/export/exportPredictionCard.ts`
- [ ] T018 [P] [US2] Build the export studio and action states in `frontend/src/features/predictions/components/ExportStudio.tsx` and `frontend/src/features/predictions/components/ExportActions.tsx`
- [ ] T019 [US2] Connect valid-session export gating and preview/download flow in `frontend/src/features/predictions/PredictionWorkspace.tsx` and `frontend/src/components/organisms/ExportPreviewCard.tsx`
- [ ] T020 [US2] Add export loading, failure, and success feedback copy in `frontend/src/features/predictions/components/ExportActions.tsx` and `frontend/src/components/molecules/InfoTile.tsx`

Allowed phase context:
- `specs/001-worldcup-predictions/tasks.md`
- `specs/001-worldcup-predictions/plan.md`
- `specs/001-worldcup-predictions/data-model.md`
- `specs/001-worldcup-predictions/contracts/worldcup-predictions.openapi.yaml`
- `frontend/package.json`
- `frontend/src/components/`
- `frontend/src/data/`
- `frontend/src/engine/`
- `frontend/src/features/predictions/`
- `frontend/src/persistence/`
- `frontend/src/types/`
- `.specify/memory/kb/kb-routing.md`

### Phase 5: User Story 3 — Personalization

Agent ID pattern: `D2-PHASE-5-<timestamp>`
Tasks: `T021, T022, T023, T024, T025`

Task block:
- [ ] T021 [P] [US3] Write failing resume and personalization tests for session restore, migration, title editing, and theme sync in `frontend/tests/unit/persistence/predictionSessionResume.test.ts` and `frontend/tests/integration/personalization.test.tsx`
- [ ] T022 [P] [US3] Build personalization controls and draft metadata editing in `frontend/src/features/predictions/components/PersonalizationPanel.tsx` and `frontend/src/features/predictions/components/PredictionToolbar.tsx`
- [ ] T023 [P] [US3] Extend session schema and storage serialization for card metadata in `frontend/src/types/prediction.ts` and `frontend/src/persistence/predictionStorage.ts`
- [ ] T024 [US3] Implement auto-save, restore, and reset actions in `frontend/src/features/predictions/usePredictionSession.ts` and `frontend/src/features/predictions/PredictionWorkspace.tsx`
- [ ] T025 [US3] Bind personalized title, creator name, and theme choices across `frontend/src/components/organisms/SettingsPanel.tsx`, `frontend/src/components/atoms/ThemeSwatch.tsx`, and `frontend/src/components/organisms/ExportPreviewCard.tsx`

Allowed phase context:
- `specs/001-worldcup-predictions/tasks.md`
- `specs/001-worldcup-predictions/plan.md`
- `specs/001-worldcup-predictions/data-model.md`
- `frontend/package.json`
- `frontend/src/components/`
- `frontend/src/data/`
- `frontend/src/features/predictions/`
- `frontend/src/persistence/`
- `frontend/src/types/`
- `.specify/memory/kb/kb-routing.md`

### Phase 6: Polish & Cross-Cutting

Agent ID pattern: `D2-PHASE-6-<timestamp>`
Tasks: `T026, T027, T028, T029`

Task block:
- [ ] T026 [P] Expand Storybook coverage for live prediction, export, and personalization states in `frontend/src/components/organisms/ExportPreviewCard.stories.tsx`, `frontend/src/components/organisms/SettingsPanel.stories.tsx`, and `frontend/src/components/molecules/MatchScoreCard.stories.tsx`
- [ ] T027 [P] Add accessibility and keyboard-flow regression coverage in `frontend/tests/integration/accessibility.spec.ts` and `frontend/src/features/predictions/components/ScoreInput.tsx`
- [ ] T028 [P] Optimize non-urgent recalculation and save responsiveness in `frontend/src/features/predictions/usePredictionSession.ts` and `frontend/src/features/predictions/PredictionWorkspace.tsx`
- [ ] T029 Update final validation and QA instructions in `frontend/package.json` and `specs/001-worldcup-predictions/quickstart.md`

Allowed phase context:
- `specs/001-worldcup-predictions/tasks.md`
- `specs/001-worldcup-predictions/plan.md`
- `specs/001-worldcup-predictions/quickstart.md`
- `frontend/package.json`
- `frontend/src/components/`
- `frontend/src/features/predictions/`
- `frontend/src/index.css`
- `.specify/memory/kb/kb-routing.md`

## Context Rules

**Shared baseline for every phase**:
- `specs/001-worldcup-predictions/tasks.md`
- `specs/001-worldcup-predictions/plan.md`
- `specs/001-worldcup-predictions/data-model.md`
- `frontend/package.json`
- `.specify/memory/kb/kb-routing.md`

**Setup / Foundational phases** may also read `specs/001-worldcup-predictions/quickstart.md`, `specs/001-worldcup-predictions/research.md`, and `specs/001-worldcup-predictions/contracts/worldcup-predictions.openapi.yaml`.

**User story phases** may inspect only the relevant prediction feature files, the shared components they touch, and the contract/design artifacts that support their specific story.

**Polish phase** may inspect changed source files from earlier phases and `quickstart.md` for final validation.

## KB Rules

KB use happens in two passes:

1. **Implementer pass**: route and query KB before writing code.
2. **Reviewer pass**: independently route and query KB after code is written, then check for violations.

Query format: `KB query: <library/API> <pattern> <concern>`

Good: `KB query: TanStack Router beforeLoad redirect authenticated`, `KB query: useMutation onSuccess invalidateQueries`, `KB query: React useCallback dependency array stale closure`
Bad: `KB query: React hook useAuth state`, `KB query: React component route page`, `KB query: backend rules`

Only purely mechanical tasks (rename, move, delete, config-value edits) are exempt.

## Phase Subagent Prompt

### Pass 1: Implementer

Spawn a subagent with this exact prompt:

`You are a Implementer Subagent, you MUST read .specify/memory/subagents/implement.md to start.`

### Pass 2: Reviewer

After the Implementer completes, spawn a second subagent with this exact prompt:

`You are a Reviewer Subagent, you MUST read .specify/memory/subagents/review.md to start.`

### Enforcement in Main Agent

After Pass 2 returns:
- If `Must-fix: 0` → mark tasks complete
- If `Must-fix: > 0` → send violations back to the Implementer with instruction: `Fix these violations. Quote the KB text and show your fix.` Then re-run the Reviewer.
- Maximum 2 correction rounds. If the phase still fails, escalate.

## Fallback

Check whether subagents are actually available in the current harness before implementation starts. If they are unavailable, the main implement agent may execute the phase directly while still following the same phase boundaries, KB routing, logging, review, and validation rules.
