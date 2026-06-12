import { z } from 'zod';

export const TeamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fifaCode: z.string().regex(/^[A-Z]{2,3}$/),
  confederation: z.string().min(2),
  flagAsset: z.string().min(1),
});

export type Team = z.infer<typeof TeamSchema>;

export const GroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  teamIds: z.array(z.string().min(1)),
});

export type Group = z.infer<typeof GroupSchema>;

export const MatchStage = z.enum([
  'group',
  'round-of-32',
  'round-of-16',
  'quarterfinal',
  'semifinal',
  'third-place',
  'final',
]);

export type MatchStage = z.infer<typeof MatchStage>;

export const MatchResultSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  advancingTeamId: z.string().nullable().optional(),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;

export const MatchSchema = z.object({
  id: z.string().min(1),
  stage: MatchStage,
  roundOrder: z.number().int().nonnegative(),
  groupId: z.string().nullable(),
  homeTeamId: z.string().min(1),
  awayTeamId: z.string().min(1),
  knockout: z.boolean(),
  kickoffAt: z.string().datetime({ offset: true }).optional(),
  kickoffTimeZone: z.literal('Asia/Singapore').optional(),
  result: MatchResultSchema.optional(),
});

export type Match = z.infer<typeof MatchSchema>;

export const TournamentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  year: z.number().int().gte(2026),
  teams: z.array(TeamSchema),
  groups: z.array(GroupSchema).length(12),
  matches: z.array(MatchSchema).length(104),
});

export type Tournament = z.infer<typeof TournamentSchema>;

/** Derived group standings row */
export interface StandingsRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
