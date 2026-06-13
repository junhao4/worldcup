import type { MatchResult } from '../types/tournament';
import type { LeaderboardUser, MatchLockOverrideMode, PredictionSession } from '../types/prediction';
import type { AppUser } from '../types/auth';
import { MatchResultSchema } from '../types/tournament';
import { LeaderboardUserSchema, MatchLockOverrideModeSchema, PredictionSessionSchema } from '../types/prediction';
import { supabase } from '../lib/supabase';
import { APP_USER_TABLE } from '../lib/simpleAuth';

interface ResultRow {
  match_id: string;
  home_score: number;
  away_score: number;
  advancing_team_id: string | null;
}

interface MatchLockOverrideRow {
  match_id: string;
  mode: string;
}

interface MatchTimeOverrideRow {
  match_id: string;
  kickoff_at: string | null;
}

function mapLeaderboardUser(user: unknown): LeaderboardUser | null {
  const parsed = LeaderboardUserSchema.safeParse(user);
  return parsed.success ? parsed.data : null;
}

function mapResultRow(row: ResultRow): MatchResult | null {
  const parsed = MatchResultSchema.safeParse({
    homeScore: row.home_score,
    awayScore: row.away_score,
    advancingTeamId: row.advancing_team_id,
  });
  return parsed.success ? parsed.data : null;
}

function mapMatchLockOverrideRow(row: MatchLockOverrideRow): MatchLockOverrideMode | null {
  const parsed = MatchLockOverrideModeSchema.safeParse(row.mode);
  return parsed.success ? parsed.data : null;
}

export function choosePreferredSession(
  localSession: PredictionSession,
  remoteSession: PredictionSession | null,
): PredictionSession {
  if (!remoteSession) return localSession;
  return remoteSession;
}

export async function loadCloudPredictionSession(
  user: AppUser,
  tournamentId: string,
): Promise<PredictionSession | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('prediction_sessions')
    .select('session')
    .eq('user_id', user.id)
    .eq('tournament_id', tournamentId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) return null;

  const parsed = PredictionSessionSchema.safeParse((data as { session: unknown }).session);
  return parsed.success ? parsed.data : null;
}

export async function saveCloudPredictionSession(
  user: AppUser,
  session: PredictionSession,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('prediction_sessions')
    .upsert({
      user_id: user.id,
      tournament_id: session.tournamentId,
      session,
      updated_at: session.updatedAt,
    }, { onConflict: 'user_id,tournament_id' });

  if (error) {
    throw error;
  }
}

export async function loadOfficialResults(matchIds: string[]): Promise<Map<string, MatchResult>> {
  if (matchIds.length === 0) return new Map();

  if (!supabase) return new Map();

  const { data, error } = await supabase
    .from('match_results')
    .select('match_id,home_score,away_score,advancing_team_id')
    .in('match_id', matchIds);

  if (error) {
    throw error;
  }

  const mapped = new Map<string, MatchResult>();
  for (const row of ((data ?? []) as ResultRow[])) {
    const result = mapResultRow(row);
    if (result) {
      mapped.set(row.match_id, result);
    }
  }

  return mapped;
}

export async function loadMatchLockOverrides(matchIds: string[]): Promise<Map<string, MatchLockOverrideMode>> {
  if (matchIds.length === 0) return new Map();
  if (!supabase) return new Map();

  const { data, error } = await supabase
    .from('match_lock_overrides')
    .select('match_id,mode')
    .in('match_id', matchIds);

  if (error) {
    throw error;
  }

  const mapped = new Map<string, MatchLockOverrideMode>();
  for (const row of ((data ?? []) as MatchLockOverrideRow[])) {
    const mode = mapMatchLockOverrideRow(row);
    if (mode) {
      mapped.set(row.match_id, mode);
    }
  }

  return mapped;
}

export async function loadMatchTimeOverrides(matchIds: string[]): Promise<Map<string, string>> {
  if (matchIds.length === 0) return new Map();
  if (!supabase) return new Map();

  const { data, error } = await supabase
    .from('match_time_overrides')
    .select('match_id,kickoff_at')
    .in('match_id', matchIds);

  if (error) {
    throw error;
  }

  const mapped = new Map<string, string>();
  for (const row of ((data ?? []) as MatchTimeOverrideRow[])) {
    if (typeof row.kickoff_at === 'string' && row.kickoff_at.length > 0) {
      mapped.set(row.match_id, row.kickoff_at);
    }
  }

  return mapped;
}

export async function loadLeaderboardUsers(): Promise<LeaderboardUser[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(APP_USER_TABLE)
    .select('id,username');

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<{ id: string; username: string }>)
    .map(row => mapLeaderboardUser({ userId: row.id, username: row.username }))
    .filter((user): user is LeaderboardUser => user != null);
}

export async function loadPublicPredictionSessions(
  tournamentId: string,
  userIds: string[],
): Promise<Array<{ userId: string; session: PredictionSession }>> {
  if (userIds.length === 0) return [];

  if (!supabase) return [];

  const { data, error } = await supabase
    .from('prediction_sessions')
    .select('user_id,session')
    .eq('tournament_id', tournamentId)
    .in('user_id', userIds);

  if (error) {
    throw error;
  }

  return (((data ?? []) as Array<{ user_id: string; session: unknown }>))
    .map(entry => {
      const parsed = PredictionSessionSchema.safeParse(entry.session);
      if (!parsed.success) return null;
      return {
        userId: entry.user_id,
        session: parsed.data,
      };
    })
    .filter((entry): entry is { userId: string; session: PredictionSession } => entry != null);
}
