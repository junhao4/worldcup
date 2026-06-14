import { useEffect, useMemo, useState } from 'react';
import type { Match, MatchResult, Tournament } from '../../../types/tournament';
import type { MatchLockOverrideMode } from '../../../types/prediction';
import { formatSingaporeDateLabel, formatSingaporeKickoff } from '../../../lib/matchTime';

type AdminFilter = 'today' | 'needs-result' | 'finished' | 'all';

export interface AdminMatchPanelProps {
  readonly tournament: Tournament;
  readonly officialResults: Map<string, MatchResult>;
  readonly lockOverrides: Map<string, MatchLockOverrideMode>;
  readonly timeOverrides: Map<string, string>;
  readonly onSaveMatch: (
    matchId: string,
    updates: {
      result: MatchResult | null;
      lockOverride: MatchLockOverrideMode;
      kickoffOverride: string | null;
    },
  ) => Promise<void>;
}

interface RowDraft {
  homeScore: string;
  awayScore: string;
  advancingTeamId: string;
  lockOverride: MatchLockOverrideMode;
  kickoffOverride: string;
}

function toDatetimeLocalValue(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function buildDraft(
  match: Match,
  officialResults: Map<string, MatchResult>,
  lockOverrides: Map<string, MatchLockOverrideMode>,
  timeOverrides: Map<string, string>,
): RowDraft {
  const result = officialResults.get(match.id) ?? match.result ?? null;
  return {
    homeScore: result ? `${result.homeScore}` : '',
    awayScore: result ? `${result.awayScore}` : '',
    advancingTeamId: result?.advancingTeamId ?? '',
    lockOverride: lockOverrides.get(match.id) ?? 'default',
    kickoffOverride: toDatetimeLocalValue(timeOverrides.get(match.id)),
  };
}

function sameDraft(a: RowDraft, b: RowDraft): boolean {
  return a.homeScore === b.homeScore
    && a.awayScore === b.awayScore
    && a.advancingTeamId === b.advancingTeamId
    && a.lockOverride === b.lockOverride
    && a.kickoffOverride === b.kickoffOverride;
}

function rowSavePayload(match: Match, draft: RowDraft) {
  const hasScores = draft.homeScore !== '' && draft.awayScore !== '';
  const result = hasScores
    ? {
        homeScore: Number.parseInt(draft.homeScore, 10),
        awayScore: Number.parseInt(draft.awayScore, 10),
        advancingTeamId: match.knockout && draft.homeScore === draft.awayScore
          ? (draft.advancingTeamId || null)
          : null,
      }
    : null;

  return {
    result,
    lockOverride: draft.lockOverride,
    kickoffOverride: draft.kickoffOverride ? new Date(draft.kickoffOverride).toISOString() : null,
  };
}

export function AdminMatchPanel({
  tournament,
  officialResults,
  lockOverrides,
  timeOverrides,
  onSaveMatch,
}: AdminMatchPanelProps) {
  const [filter, setFilter] = useState<AdminFilter>('today');
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});

  const teamMap = useMemo(
    () => new Map(tournament.teams.map(team => [team.id, team])),
    [tournament.teams],
  );

  const sortedMatches = useMemo(
    () => [...tournament.matches].sort((a, b) => {
      const kickoffA = a.kickoffAt ? new Date(a.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
      const kickoffB = b.kickoffAt ? new Date(b.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (kickoffA !== kickoffB) return kickoffA - kickoffB;
      return a.roundOrder - b.roundOrder;
    }),
    [tournament.matches],
  );

  useEffect(() => {
    const nextDrafts: Record<string, RowDraft> = {};
    for (const match of sortedMatches) {
      nextDrafts[match.id] = buildDraft(match, officialResults, lockOverrides, timeOverrides);
    }
    setDrafts(nextDrafts);
  }, [sortedMatches, officialResults, lockOverrides, timeOverrides]);

  const visibleMatches = useMemo(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    return sortedMatches.filter(match => {
      const hasResult = officialResults.has(match.id) || Boolean(match.result);
      const kickoff = new Date(timeOverrides.get(match.id) ?? match.kickoffAt ?? '');
      const isToday = !Number.isNaN(kickoff.getTime())
        && `${kickoff.getFullYear()}-${kickoff.getMonth()}-${kickoff.getDate()}` === todayKey;

      if (filter === 'today') return isToday;
      if (filter === 'needs-result') return !hasResult;
      if (filter === 'finished') return hasResult;
      return true;
    });
  }, [filter, officialResults, sortedMatches, timeOverrides]);

  async function handleSave(match: Match) {
    const draft = drafts[match.id];
    if (!draft) return;

    if ((draft.homeScore === '') !== (draft.awayScore === '')) {
      setStatuses(prev => ({ ...prev, [match.id]: 'Enter both scores or clear both.' }));
      return;
    }

    if (
      match.knockout
      && draft.homeScore !== ''
      && draft.homeScore === draft.awayScore
      && !draft.advancingTeamId
    ) {
      setStatuses(prev => ({ ...prev, [match.id]: 'Pick the team that advances.' }));
      return;
    }

    setSavingIds(prev => ({ ...prev, [match.id]: true }));
    setStatuses(prev => ({ ...prev, [match.id]: 'Saving...' }));

    try {
      await onSaveMatch(match.id, rowSavePayload(match, draft));
      setStatuses(prev => ({ ...prev, [match.id]: 'Saved.' }));
    } catch (error) {
      setStatuses(prev => ({
        ...prev,
        [match.id]: error instanceof Error ? error.message : 'Unable to save this match.',
      }));
    } finally {
      setSavingIds(prev => ({ ...prev, [match.id]: false }));
    }
  }

  function handleClear(match: Match) {
    setDrafts(prev => ({
      ...prev,
      [match.id]: {
        ...prev[match.id],
        homeScore: '',
        awayScore: '',
        advancingTeamId: '',
      },
    }));
    setStatuses(prev => ({ ...prev, [match.id]: 'Result cleared in draft. Save to apply.' }));
  }

  return (
    <section className="admin-page" data-testid="admin-page">
      <div className="admin-page__header">
        <div>
          <h2 className="schedule-page__title">Admin</h2>
          <p className="schedule-page__subtitle">Update results, match locks, and kickoff overrides without touching raw table IDs.</p>
        </div>
      </div>

      <div className="admin-page__filters" role="tablist" aria-label="Admin match filter">
        {([
          ['today', 'Today'],
          ['needs-result', 'Needs Result'],
          ['finished', 'Finished'],
          ['all', 'All'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            className={`schedule-page__filter ${filter === value ? 'schedule-page__filter--active' : ''}`}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="admin-page__list">
        {visibleMatches.map(match => {
          const draft = drafts[match.id];
          if (!draft) return null;

          const homeTeam = teamMap.get(match.homeTeamId);
          const awayTeam = teamMap.get(match.awayTeamId);
          const overrideKickoff = timeOverrides.get(match.id);
          const sourceDraft = buildDraft(match, officialResults, lockOverrides, timeOverrides);
          const dirty = !sameDraft(draft, sourceDraft);

          return (
            <article key={match.id} className="admin-match-card">
              <div className="admin-match-card__top">
                <div>
                  <p className="admin-match-card__eyebrow">
                    {match.stage === 'group' && match.groupId ? `Group ${match.groupId}` : match.stage.replaceAll('-', ' ')}
                  </p>
                  <h3 className="admin-match-card__title">
                    {homeTeam?.name ?? match.homeTeamId} vs {awayTeam?.name ?? match.awayTeamId}
                  </h3>
                  <p className="admin-match-card__meta">
                    {formatSingaporeDateLabel(overrideKickoff ?? match.kickoffAt)} · {formatSingaporeKickoff(overrideKickoff ?? match.kickoffAt) ?? 'TBD'}
                  </p>
                </div>
                <span className="admin-match-card__id">{match.id}</span>
              </div>

              <div className="admin-match-card__grid">
                <label className="admin-match-card__field">
                  <span>{homeTeam?.name ?? 'Home'} score</span>
                  <input
                    className="cloud-sync-panel__input"
                    type="text"
                    inputMode="numeric"
                    value={draft.homeScore}
                    onChange={(event) => {
                      const value = event.target.value.replace(/[^0-9]/g, '');
                      setDrafts(prev => ({ ...prev, [match.id]: { ...prev[match.id], homeScore: value } }));
                    }}
                  />
                </label>

                <label className="admin-match-card__field">
                  <span>{awayTeam?.name ?? 'Away'} score</span>
                  <input
                    className="cloud-sync-panel__input"
                    type="text"
                    inputMode="numeric"
                    value={draft.awayScore}
                    onChange={(event) => {
                      const value = event.target.value.replace(/[^0-9]/g, '');
                      setDrafts(prev => ({ ...prev, [match.id]: { ...prev[match.id], awayScore: value } }));
                    }}
                  />
                </label>

                <label className="admin-match-card__field">
                  <span>Lock override</span>
                  <select
                    className="admin-match-card__select"
                    value={draft.lockOverride}
                    onChange={(event) => {
                      const value = event.target.value as MatchLockOverrideMode;
                      setDrafts(prev => ({ ...prev, [match.id]: { ...prev[match.id], lockOverride: value } }));
                    }}
                  >
                    <option value="default">Default</option>
                    <option value="force_open">Force open</option>
                    <option value="force_locked">Force locked</option>
                  </select>
                </label>

                <label className="admin-match-card__field">
                  <span>Kickoff override</span>
                  <input
                    className="cloud-sync-panel__input"
                    type="datetime-local"
                    value={draft.kickoffOverride}
                    onChange={(event) => {
                      setDrafts(prev => ({ ...prev, [match.id]: { ...prev[match.id], kickoffOverride: event.target.value } }));
                    }}
                  />
                </label>
              </div>

              {match.knockout && draft.homeScore !== '' && draft.homeScore === draft.awayScore ? (
                <label className="admin-match-card__field">
                  <span>Advancing team</span>
                  <select
                    className="admin-match-card__select"
                    value={draft.advancingTeamId}
                    onChange={(event) => {
                      setDrafts(prev => ({ ...prev, [match.id]: { ...prev[match.id], advancingTeamId: event.target.value } }));
                    }}
                  >
                    <option value="">Select winner</option>
                    <option value={match.homeTeamId}>{homeTeam?.name ?? match.homeTeamId}</option>
                    <option value={match.awayTeamId}>{awayTeam?.name ?? match.awayTeamId}</option>
                  </select>
                </label>
              ) : null}

              <div className="admin-match-card__footer">
                <p className={`admin-match-card__status ${dirty ? 'admin-match-card__status--dirty' : ''}`}>
                  {statuses[match.id] ?? (dirty ? 'Unsaved changes.' : 'Saved values loaded.')}
                </p>
                <div className="admin-match-card__actions">
                  <button
                    className="btn btn--secondary btn--sm"
                    type="button"
                    onClick={() => handleClear(match)}
                  >
                    Clear result
                  </button>
                  <button
                    className="btn btn--primary btn--sm"
                    type="button"
                    onClick={() => void handleSave(match)}
                    disabled={Boolean(savingIds[match.id])}
                  >
                    {savingIds[match.id] ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {visibleMatches.length === 0 ? (
          <section className="schedule-page__empty">
            <h3>No matches in this view</h3>
            <p>Switch the filter to find another batch of matches.</p>
          </section>
        ) : null}
      </div>
    </section>
  );
}
