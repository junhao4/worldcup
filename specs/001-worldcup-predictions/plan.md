# Implementation Plan: World Cup Prediction Website

**Branch**: `001-worldcup-predictions` | **Date**: 2026-06-11 | **Spec**: [spec.md](/Users/junhaong/Documents/work/worldcup%20preds/specs/001-worldcup-predictions/spec.md)
**Input**: Feature specification from `/specs/001-worldcup-predictions/spec.md`

## Summary

Evolve the current React 19 + TypeScript + Vite predictor into a live tournament product with account-backed persistence, 1-hour pre-kickoff match locks, official result reveal, cumulative point scoring, public leaderboard participation, and organizer-managed official scores stored in Supabase. The app will keep its pure tournament engine for bracket derivation, but shift persistence and competition state to Supabase Auth + Postgres while preserving a light local cache for resilience and fast resume.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Vite 6  
**Primary Dependencies**: React, React DOM, Vite, lucide-react, class-variance-authority, clsx, tailwind-merge, Storybook, Zod, Supabase JS  
**Storage**: Supabase Postgres for prediction sessions, public profiles, official match results, and leaderboard queries; browser `localStorage` as a defensive local cache  
**Authentication**: Supabase email magic-link auth for cross-device restore and public leaderboard participation  
**Testing**: Vitest for engine, scoring, and persistence logic; React Testing Library for interaction and state-copy flows; Playwright for lock timing, result reveal, auth, and leaderboard flows; `npm run build` as a release gate  
**Target Platform**: Modern desktop and mobile browsers on evergreen Chromium, Safari, and Firefox  
**Project Type**: Web application  
**Performance Goals**: Initial interactive load under 2 seconds on a warmed build, lock-state recompute under 50ms for a single render pass, official result/leaderboard refresh visible within 1 minute of Supabase data change, export generation under 2 seconds for the default prediction card  
**Constraints**: Must lock predictions 1 hour before kickoff, must not expose private identifiers publicly, must support organizer result entry without code changes, must meet WCAG 2.1 AA, must avoid internal implementation wording in user-facing account/save copy  
**Scale/Scope**: One full 2026 tournament model with 48 teams, 12 groups, 104 matches; signed-in multi-device prediction restore; one public leaderboard; one organizer-maintained official results table; one polished export card variant

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality**: PASS. The current codebase already separates tournament rules, persistence, and UI composition. The new work can extend those boundaries with dedicated auth, profile, result, and leaderboard modules.
- **Testing Standards**: PASS WITH REQUIRED WORK. New implementation must start with failing tests for lock timing, result comparison, scoring rules, public leaderboard ranking, display-name handling, and remote persistence behaviors.
- **User Experience**: PASS. The new scope adds clear states for open, locked, in progress, completed, pending official result, signed-in restore, and public participation preferences.
- **Performance**: PASS. Tournament progression remains derived locally; Supabase is used for persisted user state and official-result state, not for per-keystroke bracket computation.
- **Development Environment**: PASS. Local development remains frontend-first with env-based Supabase configuration and no custom backend service required.
- **Security and Compliance**: PASS WITH REQUIRED WORK. Public views must use only display names and scores; email addresses and internal identifiers must stay private. Supabase RLS policies are mandatory.

**Post-Design Re-Check**: Expected to pass if Phase 1 artifacts keep score computation deterministic, use least-privilege RLS, and avoid coupling leaderboard UI directly to private auth data.

## Project Structure

### Documentation (this feature)

```text
specs/001-worldcup-predictions/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
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
├── public/
├── .env.example
└── tests/
    ├── integration/
    └── unit/
```

**Structure Decision**: Continue using the existing `frontend/` app as the only runtime surface. Add feature modules for auth/profile/leaderboard/result comparison inside the current frontend structure rather than introducing a separate backend service.

## Phase 0: Research Output

- Confirm the lock model as a pure time-based rule: editable until `kickoffAt - 1 hour`, then permanently read-only.
- Define the official-result source of truth in Supabase, including knockout advancing-team handling.
- Define the public leaderboard data path, including display-name privacy boundaries and ranking strategy.
- Confirm the UX copy model so account/save states avoid naming internal implementation details.
- Extend the test strategy to cover time-based lock behavior, result comparison, scoring, and leaderboard rendering.

## Phase 1: Design Output

- Update the data model for user profile, public participation preference, official match result, and leaderboard entry.
- Define Supabase table boundaries and ownership rules:
  - `prediction_sessions`
  - `profiles`
  - `match_results` or equivalent result fields
- Define how match state is derived from kickoff time plus official result presence:
  - `open`
  - `locked`
  - `in_progress`
  - `completed`
  - `awaiting_official_result`
- Define the scoring model for group and knockout matches, including advancing-side resolution.
- Update quickstart with Supabase env setup, Auth configuration, RLS expectations, and local dev validation steps.

## Complexity Tracking

No constitution violation currently requires justification, but the following areas need explicit design choices before implementation:

- **Lock timing**: client-only display can use browser time, but enforcement for persisted edits should treat Supabase-stored kickoff as the source of truth.
- **Leaderboard ranking ties**: current spec assumes cumulative points only; tie ordering remains undefined until clarified.
- **Organizer operations**: official daily result entry should work through Supabase table tooling, not a custom admin console in this phase unless needed later.

## Architecture Direction

### Runtime Model

- Keep tournament bracket and standings logic as pure local engine functions.
- Use Supabase Auth for account identity.
- Use Supabase Postgres for:
  - saved prediction sessions
  - public user profiles and display names
  - official match results
  - leaderboard queries or client-computed leaderboard reads
- Use localStorage only as:
  - startup cache
  - offline resilience layer
  - fallback when remote state is unavailable

### Feature Slices

1. **Prediction Authoring**
   - existing score-entry flow
   - new lock-state derivation
   - read-only state after lock

2. **Official Results & Comparison**
   - fetch official result by match
   - show user prediction beside final result
   - show earned points and cumulative score

3. **Identity & Profiles**
   - sign-in
   - display-name editing
   - public leaderboard participation toggle

4. **Leaderboard**
   - public ranking list
   - safe profile rendering
   - cumulative score summary

5. **Export**
   - preserve current PNG export behavior
   - ensure export remains gated by valid prediction state

## Data Direction

### Expected Supabase Tables

- `prediction_sessions`
  - per-user, per-tournament stored prediction payload
  - source for cross-device restore

- `profiles`
  - `user_id`
  - `display_name`
  - `is_public`
  - optional metadata needed for leaderboard-safe rendering

- `match_results`
  - `match_id`
  - `home_score`
  - `away_score`
  - `advancing_team_id` when required
  - `updated_at`

### Derived Data

- match lock state derived from:
  - `kickoffAt`
  - current time
  - official result presence

- leaderboard entry derived from:
  - official results
  - stored prediction sessions
  - public profile filter

## Testing Strategy

### Unit

- lock window calculation
- match state derivation
- scoring rules for:
  - exact result
  - correct outcome only
  - knockout advancing-side resolution
- profile and leaderboard-safe mapping helpers

### Integration

- prediction inputs become read-only at locked state
- completed match comparison renders user score vs official score
- display-name entry and public participation preference
- leaderboard rendering with public-safe fields only

### End-to-End

- sign in with account and restore session
- make picks before lock, confirm edits blocked after lock threshold
- enter official results in backing data and confirm comparison/points update
- public leaderboard ranking flow

## Delivery Strategy

### Suggested Phase Order

1. **Data & Auth Foundation**
   - finalize Supabase tables, env setup, profile model, and RLS expectations

2. **Locking & Match State**
   - implement lock timing and read-only UX before changing leaderboard/result flows

3. **Official Results & Scoring**
   - implement result fetch, comparison UI, and cumulative points

4. **Profiles & Leaderboard**
   - implement display name, public participation preference, and ranking screens

5. **Copy & Polish**
   - remove internal platform wording from user-facing copy
   - refine mobile states and post-match comparison clarity

## Release Notes for Planning

This plan supersedes the earlier same-device-only approach. The app is now planned as a live tournament product with public competition and organizer-managed official results, while still keeping the frontend engine deterministic and testable.
