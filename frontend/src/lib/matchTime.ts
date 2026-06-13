import type { MatchLockOverrideMode } from '../types/prediction';

const SINGAPORE_TIME_ZONE = 'Asia/Singapore';
const MATCH_LOCK_WINDOW_MS = 15 * 60 * 1000;
const MATCH_IN_PROGRESS_WINDOW_MS = 3 * 60 * 60 * 1000;

const singaporeFormatter = new Intl.DateTimeFormat('en-SG', {
  day: 'numeric',
  hour: 'numeric',
  hour12: true,
  minute: '2-digit',
  month: 'short',
  timeZone: SINGAPORE_TIME_ZONE,
});

const singaporeDateFormatter = new Intl.DateTimeFormat('en-SG', {
  day: 'numeric',
  month: 'long',
  timeZone: SINGAPORE_TIME_ZONE,
  weekday: 'long',
});

export function formatSingaporeKickoff(kickoffAt: string | undefined): string | null {
  if (!kickoffAt) return null;
  const date = new Date(kickoffAt);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = singaporeFormatter.format(date).replace(/\b(am|pm)\b/g, value => value.toUpperCase());
  return `${formatted} SGT`;
}

export function formatSingaporeDateLabel(kickoffAt: string | undefined): string | null {
  if (!kickoffAt) return null;
  const date = new Date(kickoffAt);
  if (Number.isNaN(date.getTime())) return null;
  return singaporeDateFormatter.format(date);
}

export function getKickoffTimestamp(kickoffAt: string | undefined): number | null {
  if (!kickoffAt) return null;
  const timestamp = new Date(kickoffAt).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getPredictionLockTimestamp(kickoffAt: string | undefined): number | null {
  const kickoffTimestamp = getKickoffTimestamp(kickoffAt);
  return kickoffTimestamp == null ? null : kickoffTimestamp - MATCH_LOCK_WINDOW_MS;
}

export function getMatchLifecycleState(
  kickoffAt: string | undefined,
  hasOfficialResult: boolean,
  lockOverride: MatchLockOverrideMode = 'default',
  now = Date.now(),
): 'open' | 'locked' | 'in_progress' | 'awaiting_official_result' | 'completed' {
  if (lockOverride === 'force_open') return 'open';
  if (lockOverride === 'force_locked') return 'locked';
  if (hasOfficialResult) return 'completed';

  const kickoffTimestamp = getKickoffTimestamp(kickoffAt);
  if (kickoffTimestamp == null) return 'open';

  if (now < kickoffTimestamp - MATCH_LOCK_WINDOW_MS) return 'open';
  if (now < kickoffTimestamp) return 'locked';
  if (now < kickoffTimestamp + MATCH_IN_PROGRESS_WINDOW_MS) return 'in_progress';
  return 'awaiting_official_result';
}
