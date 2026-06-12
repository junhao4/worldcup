# Data Model: World Cup Prediction Website

## Entity: Tournament

**Purpose**: Represents the fixed 2026 World Cup structure, including seeded teams, groups, and all matches required to derive progression.

**Fields**:
- `id`: stable string identifier, for example `world-cup-2026`
- `name`: display name for the competition
- `year`: numeric tournament year
- `teams`: list of participating teams
- `groups`: 12 groups containing four teams each
- `matches`: 104 scheduled matches across group and knockout play

**Relationships**:
- Owns many `Team` records
- Owns many `Match` records
- Is referenced by each `PredictionSession`

**Validation Rules**:
- Tournament seed data must contain unique team IDs and unique match IDs
- Every group-stage match must reference a valid `groupId`
- Every knockout match must reference valid source slots for advancement rules

**Java JPA Representation**:

```java
@Entity
@Table(name = "tournaments")
public class TournamentEntity {
  @Id
  @Column(nullable = false, unique = true)
  private String id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private Integer year;

  @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<MatchEntity> matches = new ArrayList<>();

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant updatedAt;
}
```

**TypeScript/Zod Representation**:

```ts
export const TournamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  year: z.number().int().gte(2026),
  teams: z.array(TeamSchema),
  groups: z.array(GroupSchema).length(12),
  matches: z.array(MatchSchema).length(104),
});

export type Tournament = z.infer<typeof TournamentSchema>;
```

## Entity: Team

**Purpose**: Represents a national team available in the tournament seed and later in match predictions, standings, and export summaries.

**Fields**:
- `id`: stable team identifier
- `name`: public display name
- `fifaCode`: short uppercase team code
- `confederation`: regional federation label
- `flagAsset`: local asset path or remote source key

**Relationships**:
- Appears in many `Match` records
- Appears in derived standings and bracket outcomes

**Validation Rules**:
- `fifaCode` must be 2 to 3 uppercase characters
- `flagAsset` must resolve to a bundled or cached design asset

**Java JPA Representation**:

```java
@Entity
@Table(name = "teams")
public class TeamEntity {
  @Id
  @Column(nullable = false, unique = true)
  private String id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, length = 3)
  private String fifaCode;

  @Column(nullable = false)
  private String confederation;

  @Column(nullable = false)
  private String flagAsset;
}
```

**TypeScript/Zod Representation**:

```ts
export const TeamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fifaCode: z.string().regex(/^[A-Z]{2,3}$/),
  confederation: z.string().min(2),
  flagAsset: z.string().min(1),
});

export type Team = z.infer<typeof TeamSchema>;
```

## Entity: Match

**Purpose**: Defines a scheduled tournament fixture and the metadata required to compute group standings or knockout advancement.

**Fields**:
- `id`: stable match identifier
- `stage`: `group`, `round-of-32`, `round-of-16`, `quarterfinal`, `semifinal`, `third-place`, or `final`
- `roundOrder`: numeric ordering within the tournament
- `groupId`: nullable group identifier for group-stage matches
- `homeTeamId`: seeded or derived home participant
- `awayTeamId`: seeded or derived away participant
- `knockout`: boolean flag for advancement rules

**Relationships**:
- Belongs to one `Tournament`
- Has at most one `MatchPrediction` per `PredictionSession`

**Validation Rules**:
- Knockout matches must not remain tied without an advancing team selection in a valid prediction
- Group-stage matches allow tied scores

**Java JPA Representation**:

```java
@Entity
@Table(name = "matches")
public class MatchEntity {
  @Id
  @Column(nullable = false, unique = true)
  private String id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "tournament_id", nullable = false)
  private TournamentEntity tournament;

  @Column(nullable = false)
  private String stage;

  @Column(nullable = false)
  private Integer roundOrder;

  @Column
  private String groupId;

  @Column(nullable = false)
  private String homeTeamId;

  @Column(nullable = false)
  private String awayTeamId;

  @Column(nullable = false)
  private boolean knockout;
}
```

**TypeScript/Zod Representation**:

```ts
export const MatchSchema = z.object({
  id: z.string().min(1),
  stage: z.enum([
    'group',
    'round-of-32',
    'round-of-16',
    'quarterfinal',
    'semifinal',
    'third-place',
    'final',
  ]),
  roundOrder: z.number().int().nonnegative(),
  groupId: z.string().nullable(),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  knockout: z.boolean(),
});

export type Match = z.infer<typeof MatchSchema>;
```

## Entity: MatchPrediction

**Purpose**: Stores the user-entered scoreline for a single match and, when needed, the chosen advancing team for knockout ties.

**Fields**:
- `matchId`: referenced tournament match ID
- `homeScore`: predicted home score
- `awayScore`: predicted away score
- `advancingTeamId`: nullable until a knockout tie requires a winner

**Relationships**:
- Belongs to one `PredictionSession`
- References one `Match`

**Validation Rules**:
- Scores must be integers greater than or equal to zero
- `advancingTeamId` is required when `homeScore === awayScore` for a knockout match
- `advancingTeamId` must match either the home or away team in that match context

**State Transitions**:
- `empty` -> `scored`
- `scored` -> `tie-needs-winner` when a knockout score is tied
- `tie-needs-winner` -> `resolved`
- any state -> `reset` when upstream bracket dependencies change

**Java JPA Representation**:

```java
@Entity
@Table(name = "match_predictions")
public class MatchPredictionEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private String matchId;

  @Column(nullable = false)
  private Integer homeScore;

  @Column(nullable = false)
  private Integer awayScore;

  @Column
  private String advancingTeamId;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @Column(nullable = false)
  private Instant updatedAt;
}
```

**TypeScript/Zod Representation**:

```ts
export const MatchPredictionSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  advancingTeamId: z.string().nullable(),
});

export type MatchPrediction = z.infer<typeof MatchPredictionSchema>;
```

## Entity: PredictionCard

**Purpose**: Captures the share-facing display preferences that shape the preview and final PNG.

**Fields**:
- `title`: user-defined export title
- `creatorName`: optional display name
- `themeId`: selected theme preset
- `championTeamId`: derived winner shown on the card

**Relationships**:
- Belongs to one `PredictionSession`
- Reads from derived tournament output during preview and export

**Validation Rules**:
- `title` must be non-empty and capped for layout safety
- `themeId` must map to a supported preset
- `championTeamId` must be null until the prediction is complete and valid

**Java JPA Representation**:

```java
@Embeddable
public class PredictionCardEmbeddable {
  @Column(nullable = false)
  private String title;

  @Column
  private String creatorName;

  @Column(nullable = false)
  private String themeId;

  @Column
  private String championTeamId;
}
```

**TypeScript/Zod Representation**:

```ts
export const PredictionCardSchema = z.object({
  title: z.string().min(1).max(80),
  creatorName: z.string().max(40).nullable(),
  themeId: z.string().min(1),
  championTeamId: z.string().nullable(),
});

export type PredictionCard = z.infer<typeof PredictionCardSchema>;
```

## Entity: PredictionSession

**Purpose**: Represents the full in-progress or completed prediction stored in the browser and mirrored to the hosted database for signed-in users.

**Fields**:
- `id`: stable session identifier
- `userId`: authenticated player identifier for cloud save and leaderboard joins
- `tournamentId`: linked tournament identifier
- `predictions`: all `MatchPrediction` entries authored by the user
- `card`: `PredictionCard` display settings
- `updatedAt`: last local edit timestamp
- `schemaVersion`: persistence version key

**Relationships**:
- References one `Tournament`
- References one authenticated player account
- Owns many `MatchPrediction` records
- Owns one `PredictionCard`

**Validation Rules**:
- Session is exportable only when every required match is predicted and every knockout tie has an advancing team
- Session restore must ignore or migrate unsupported schema versions

**State Transitions**:
- `draft` -> `complete`
- `complete` -> `invalidated` when an upstream prediction change resets downstream slots
- `invalidated` -> `draft`
- `complete` -> `export-ready`

**Java JPA Representation**:

```java
@Entity
@Table(name = "prediction_sessions")
public class PredictionSessionEntity {
  @Id
  @Column(nullable = false, unique = true)
  private String id;

  @Column(nullable = false)
  private String tournamentId;

  @Embedded
  private PredictionCardEmbeddable card;

  @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
  @JoinColumn(name = "prediction_session_id")
  private List<MatchPredictionEntity> predictions = new ArrayList<>();

  @Column(nullable = false)
  private String schemaVersion;

  @Column(nullable = false)
  private Instant updatedAt;
}
```

**TypeScript/Zod Representation**:

```ts
export const PredictionSessionSchema = z.object({
  id: z.string().min(1),
  tournamentId: z.string().min(1),
  predictions: z.array(MatchPredictionSchema),
  card: PredictionCardSchema,
  updatedAt: z.string().datetime(),
  schemaVersion: z.literal('prediction-session:v1'),
});

export type PredictionSession = z.infer<typeof PredictionSessionSchema>;
```

## Entity: UserProfile

**Purpose**: Stores the player-facing display name and public leaderboard preference for a signed-in user.

**Fields**:
- `userId`: authenticated account ID
- `displayName`: public-facing player name
- `isPublic`: whether this player appears on the public leaderboard
- `updatedAt`: last profile update timestamp

**Relationships**:
- Belongs to one authenticated player account
- Is referenced when building `LeaderboardEntry` records

**Validation Rules**:
- `displayName` must be 1 to 40 characters after trimming
- Only public profiles participate in the leaderboard

**Supabase/Postgres Representation**:

```sql
create table if not exists public.profiles (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  is_public boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);
```

**TypeScript/Zod Representation**:

```ts
export const UserProfileSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1).max(40),
  isPublic: z.boolean(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
```

## Entity: OfficialMatchResult

**Purpose**: Stores the official result entered by the organizer after each real-world match, which locks in scoring and side-by-side comparison.

**Fields**:
- `matchId`: tournament match identifier
- `homeScore`: official home score
- `awayScore`: official away score
- `advancingTeamId`: required for knockout draws when a winner advances
- `updatedAt`: last result update timestamp

**Relationships**:
- References one `Match`
- Drives `LeaderboardEntry` recalculation and per-match point totals

**Validation Rules**:
- Scores must be integers greater than or equal to zero
- `advancingTeamId` must be null for group matches unless knockout rules apply
- Each match may have only one official result row

**Supabase/Postgres Representation**:

```sql
create table if not exists public.match_results (
  match_id text primary key,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  advancing_team_id text null,
  updated_at timestamptz not null default timezone('utc', now())
);
```

**TypeScript/Zod Representation**:

```ts
export const MatchResultSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  advancingTeamId: z.string().nullable().optional(),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;
```

## Entity: LeaderboardEntry

**Purpose**: Represents one public row in the live leaderboard derived from official results, saved prediction sessions, and public profiles.

**Fields**:
- `userId`: player identifier
- `displayName`: public name pulled from `UserProfile`
- `totalPoints`: total scored points
- `outcomePoints`: one point per correct winner or advancing team
- `exactScorePoints`: one point for each exact home or away score
- `gradedPredictionCount`: number of that player's predictions that now have official results
- `resultMatchCount`: total number of tournament matches with official results
- `rank`: display ordering after sort

**Relationships**:
- Derived from one `PredictionSession`
- Derived from one `UserProfile`
- Derived from many `OfficialMatchResult` records

**Validation Rules**:
- Hidden profiles must not produce leaderboard entries
- Rank must be recalculated after any official result or profile visibility change

**TypeScript/Zod Representation**:

```ts
export const LeaderboardEntrySchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1),
  totalPoints: z.number().int().nonnegative(),
  outcomePoints: z.number().int().nonnegative(),
  exactScorePoints: z.number().int().nonnegative(),
  gradedPredictionCount: z.number().int().nonnegative(),
  resultMatchCount: z.number().int().nonnegative(),
  rank: z.number().int().positive(),
  isCurrentUser: z.boolean().optional(),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
```

## Entity: ExportImage

**Purpose**: Describes the generated share artifact returned by the export flow.

**Fields**:
- `status`: export readiness state
- `fileName`: download filename
- `width`: pixel width
- `height`: pixel height
- `dataUrl`: optional in-memory PNG payload

**Relationships**:
- Derived from one valid `PredictionSession`

**Validation Rules**:
- Export may only succeed for a complete and valid prediction session
- Width and height must match the supported card layout variant

**Java JPA Representation**:

```java
@Embeddable
public class ExportImageEmbeddable {
  @Column(nullable = false)
  private String status;

  @Column(nullable = false)
  private String fileName;

  @Column(nullable = false)
  private Integer width;

  @Column(nullable = false)
  private Integer height;

  @Lob
  private String dataUrl;
}
```

**TypeScript/Zod Representation**:

```ts
export const ExportImageSchema = z.object({
  status: z.enum(['ready']),
  fileName: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  dataUrl: z.string().nullable(),
});

export type ExportImage = z.infer<typeof ExportImageSchema>;
```
