import { z } from 'zod';

export const MatchPredictionSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  advancingTeamId: z.string().nullable(),
});

export type MatchPrediction = z.infer<typeof MatchPredictionSchema>;

export const PredictionCardSchema = z.object({
  title: z.string().min(1).max(80),
  creatorName: z.string().max(40).nullable(),
  themeId: z.string().min(1),
  championTeamId: z.string().nullable(),
});

export const DEFAULT_CARD: PredictionCard = {
  title: 'My 2026 World Cup Path',
  creatorName: null,
  themeId: 'classic',
  championTeamId: null,
};

export type PredictionCard = z.infer<typeof PredictionCardSchema>;

export const SCHEMA_VERSION = 'prediction-session:v1' as const;

export const PredictionSessionSchema = z.object({
  id: z.string().min(1),
  tournamentId: z.string().min(1),
  predictions: z.array(MatchPredictionSchema),
  card: PredictionCardSchema,
  updatedAt: z.string().datetime(),
  schemaVersion: z.literal(SCHEMA_VERSION),
});

export type PredictionSession = z.infer<typeof PredictionSessionSchema>;

export const MatchLifecycleStateSchema = z.enum([
  'open',
  'locked',
  'in_progress',
  'awaiting_official_result',
  'completed',
]);

export type MatchLifecycleState = z.infer<typeof MatchLifecycleStateSchema>;

export const MatchLockOverrideModeSchema = z.enum([
  'default',
  'force_locked',
  'force_open',
]);

export type MatchLockOverrideMode = z.infer<typeof MatchLockOverrideModeSchema>;

export const LeaderboardUserSchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1).max(24),
});

export type LeaderboardUser = z.infer<typeof LeaderboardUserSchema>;

export const LeaderboardEntrySchema = z.object({
  userId: z.string().min(1),
  username: z.string().min(1),
  totalPoints: z.number().int().nonnegative(),
  outcomePoints: z.number().int().nonnegative(),
  exactScorePoints: z.number().int().nonnegative(),
  correctResultCount: z.number().int().nonnegative(),
  resultAccuracy: z.number().min(0).max(100),
  gradedPredictionCount: z.number().int().nonnegative(),
  resultMatchCount: z.number().int().nonnegative(),
  rank: z.number().int().positive(),
  isCurrentUser: z.boolean().optional(),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const PredictionValidationResultSchema = z.object({
  complete: z.boolean(),
  valid: z.boolean(),
  championTeamId: z.string().nullable(),
  missingMatchIds: z.array(z.string()),
  resetMatchIds: z.array(z.string()),
  messages: z.array(z.string()),
});

export type PredictionValidationResult = z.infer<typeof PredictionValidationResultSchema>;

export const ExportImageSchema = z.object({
  status: z.enum(['ready']),
  fileName: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  dataUrl: z.string().nullable(),
});

export type ExportImage = z.infer<typeof ExportImageSchema>;
