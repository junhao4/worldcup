# Quickstart: World Cup Prediction Website

## Prerequisites

- Node 20+
- npm
- Java 21 only if we later stand up the planned backend contract target

## Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL and verify that:
- the prediction workspace renders with group and knockout sections
- score inputs accept numeric values and update standings live
- locked matches become read-only 15 minutes before kickoff
- finished matches show the official result beside the user's pick
- the leaderboard tab appears and updates when public players exist
- the export preview is visible when all predictions are complete
- personalization (title, export credit, theme) reflects in the preview

## Database Setup

For the current lightweight localhost-friendly login flow, run this in Supabase SQL Editor:

```sql
create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  password_hash text not null,
  password_salt text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.prediction_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  tournament_id text not null,
  session jsonb not null,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, tournament_id)
);

create table if not exists public.profiles (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  is_public boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.match_results (
  match_id text primary key,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  advancing_team_id text null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.match_lock_overrides (
  match_id text primary key,
  mode text not null check (mode in ('default', 'force_locked', 'force_open')),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.match_time_overrides (
  match_id text primary key,
  kickoff_at timestamptz null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_users enable row level security;
alter table public.prediction_sessions enable row level security;
alter table public.profiles enable row level security;
alter table public.match_results enable row level security;
alter table public.match_lock_overrides enable row level security;
alter table public.match_time_overrides enable row level security;

drop policy if exists "fun app users policy" on public.app_users;
create policy "fun app users policy"
on public.app_users
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "fun app prediction sessions policy" on public.prediction_sessions;
create policy "fun app prediction sessions policy"
on public.prediction_sessions
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "fun app profiles policy" on public.profiles;
create policy "fun app profiles policy"
on public.profiles
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "fun app match results policy" on public.match_results;
create policy "fun app match results policy"
on public.match_results
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "fun app lock overrides policy" on public.match_lock_overrides;
create policy "fun app lock overrides policy"
on public.match_lock_overrides
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "fun app time overrides policy" on public.match_time_overrides;
create policy "fun app time overrides policy"
on public.match_time_overrides
for all
to anon, authenticated
using (true)
with check (true);
```

This setup is intentionally lightweight so it works directly from the browser on localhost. It is fine for a fun side project, but anyone with your anon key and some determination could inspect or write data. Do not use this pattern for anything sensitive.

## Frontend Environment Variables

Add these to `frontend/.env.local` for local development:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Use the Table Editor every day to update `match_results`:

1. Open `match_results`.
2. Add or edit the row for that day's `match_id`.
3. Fill in `home_score` and `away_score`.
4. For a knockout draw, also set `advancing_team_id`.
5. Save the row and refresh the app to see points and leaderboard update.

Use `match_lock_overrides` when you need to override the usual 1-hour lock rule for a specific match:

1. Open `match_lock_overrides`.
2. Add or edit the row for that `match_id`.
3. Set `mode` to one of:
   - `default`
   - `force_locked`
   - `force_open`
4. Save the row and refresh the app.

Use `match_time_overrides` when you want to temporarily test a different kickoff date/time for a specific match:

1. Open `match_time_overrides`.
2. Add or edit the row for that `match_id`.
3. Set `kickoff_at` to the override datetime you want.
4. Save the row and refresh the app.
5. Delete the row or set it back to the real time when you are done testing.

## Build Validation

```bash
cd frontend
npm run build
```

## Full Validation (TypeScript + Unit Tests + Build)

```bash
cd frontend
npm run validate
```

This runs `tsc -b`, `vitest run`, and `vite build` in sequence. All three must pass before shipping.

## Test Commands

```bash
cd frontend
npm run test          # Unit + integration tests (Vitest)
npm run test:watch    # Watch mode
npm run test:e2e      # Playwright end-to-end tests
npm run test:a11y     # Accessibility regression tests (Playwright)
```

## Storybook

```bash
cd frontend
npm run storybook
```

Use Storybook to verify:
- `Molecules/MatchScoreCard` — live prediction, knockout tie, and unpredicted states
- `Organisms/ExportPreviewCard` — all theme variants, empty state, and long titles
- `Organisms/SettingsPanel` — default, personalized, and theme-selected states

## QA Checklist

1. **MVP Flow**: Enter scores for all group matches → verify standings update → enter knockout scores → select advancing team on ties → champion is displayed.
2. **Export**: Complete all predictions → open export preview → download PNG.
3. **Personalization**: Change card title, export credit, and theme → verify preview updates → refresh page → confirm draft restores.
4. **Leaderboard**: Sign in with two accounts → give each a display name → mark both public → confirm ranking sorts by total points and exact-score points.
5. **Official Results**: Enter a result in `match_results` → refresh the app → confirm the official score appears beside the prediction and points increase.
6. **Accessibility**: Tab through score inputs in order → use Arrow keys to navigate advancement buttons → verify all inputs have accessible labels.
7. **Responsive**: Check workspace layout at 375px, 768px, and 1280px viewport widths.

## Design Asset Context

- Newest Stitch design inventory: `frontend/.stitch/designs/latest-inventory.json`
- Localized CDN-backed Stitch HTML: `frontend/.stitch/designs/localized/`
- Cached Google/Tailwind assets manifest: `frontend/.stitch/designs/google-cdn-assets/manifest.json`

## Future Backend Contract Target

```bash
cd backend
./mvnw spring-boot:run
```

Once a backend exists, the OpenAPI document in `specs/001-worldcup-predictions/contracts/worldcup-predictions.openapi.yaml` becomes the reference contract.
