import type { Match, MatchResult, MatchStage, Tournament } from '../../types/tournament';
import type { MatchLifecycleState } from '../../types/prediction';
import { useMemo, useState, useCallback } from 'react';
import { usePredictionSession } from './usePredictionSession';
import { GroupStandingsPanel } from './components/GroupStandingsPanel';
import { KnockoutBracketView } from './components/KnockoutBracketView';
import { ScoreInput } from './components/ScoreInput';
import { CloudSyncPanel } from './components/CloudSyncPanel';
import { buildResolvedKnockoutProgression, computeGroupStandings, computePredictionPoints, scoreMatchPrediction } from '../../engine';
import {
  formatSingaporeDateLabel,
  formatSingaporeKickoff,
  getMatchLifecycleState,
} from '../../lib/matchTime';
import type { AppAuthState } from '../../hooks/useAppAuth';

export type WorkspaceTab = 'groups' | 'schedule' | 'third-place' | 'knockouts' | 'leaderboard';
type ScheduleFilter = 'upcoming' | 'past';

export interface PredictionWorkspaceProps {
  readonly tournament: Tournament;
  readonly auth: AppAuthState;
}

const KNOCKOUT_STAGES: ReadonlyArray<{ id: MatchStage; label: string; shortLabel: string }> = [
  { id: 'round-of-32', label: 'Round of 32', shortLabel: 'R32' },
  { id: 'round-of-16', label: 'Round of 16', shortLabel: 'R16' },
  { id: 'quarterfinal', label: 'Quarterfinals', shortLabel: 'QF' },
  { id: 'semifinal', label: 'Semifinals', shortLabel: 'SF' },
  { id: 'final', label: 'Final', shortLabel: 'Final' },
  { id: 'third-place', label: 'Third Place', shortLabel: '3rd' },
];

const STAGE_LABELS: Record<MatchStage, string> = {
  group: 'Group Stage',
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  quarterfinal: 'Quarterfinal',
  semifinal: 'Semifinal',
  'third-place': 'Third Place',
  final: 'Final',
};

const STATE_LABELS: Record<MatchLifecycleState, string> = {
  open: 'Open',
  locked: 'Locked',
  in_progress: 'Live',
  awaiting_official_result: 'Pending Result',
  completed: 'Finished',
};

function mergeOfficialResults(tournament: Tournament, results: Map<string, MatchResult>) {
  const matches = tournament.matches.map(match => ({
    ...match,
    result: results.get(match.id) ?? match.result,
  }));

  return {
    ...tournament,
    matches,
  };
}

function mergeKickoffOverrides(tournament: Tournament, overrides: Map<string, string>) {
  const matches = tournament.matches.map(match => ({
    ...match,
    kickoffAt: overrides.get(match.id) ?? match.kickoffAt,
  }));

  return {
    ...tournament,
    matches,
  };
}

export function PredictionWorkspace({ tournament, auth }: PredictionWorkspaceProps) {
  const {
    session,
    predictedCount,
    totalMatches,
    cloudSyncStatus,
    cloudSyncMessage,
    profile,
    profileStatus,
    profileMessage,
    leaderboardEntries,
    leaderboardStatus,
    leaderboardMessage,
    officialResults,
    matchLockOverrides,
    matchTimeOverrides,
    handleScoreChange,
    handleAdvancingTeamChange,
    handleProfileChange,
    handleReset,
  } = usePredictionSession(tournament, { user: auth.user });

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('schedule');
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>('upcoming');
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [selectedKnockoutStage, setSelectedKnockoutStage] = useState<MatchStage>('round-of-32');
  const [selectedKnockoutMatchId, setSelectedKnockoutMatchId] = useState<string | null>(null);

  const tournamentWithResults = useMemo(() => {
    const timeAdjustedTournament = mergeKickoffOverrides(tournament, matchTimeOverrides);
    return mergeOfficialResults(timeAdjustedTournament, officialResults);
  }, [matchTimeOverrides, officialResults, tournament]);
  const teamMap = useMemo(() => new Map(tournamentWithResults.teams.map(team => [team.id, team])), [tournamentWithResults.teams]);
  const predMap = useMemo(() => new Map(session.predictions.map(prediction => [prediction.matchId, prediction])), [session.predictions]);
  const groupMatches = useMemo(
    () => tournamentWithResults.matches.filter(match => match.stage === 'group'),
    [tournamentWithResults.matches],
  );
  const knockoutMatches = useMemo(
    () => tournamentWithResults.matches.filter(match => match.knockout),
    [tournamentWithResults.matches],
  );
  const pointsSummary = useMemo(
    () => computePredictionPoints(tournamentWithResults.matches, session.predictions),
    [tournamentWithResults.matches, session.predictions],
  );
  const knockoutProgression = useMemo(
    () => buildResolvedKnockoutProgression(
      knockoutMatches,
      groupMatches,
      session.predictions,
      tournamentWithResults.groups,
    ),
    [knockoutMatches, groupMatches, session.predictions, tournamentWithResults.groups],
  );
  const matchStates = useMemo(
    () => new Map(
      tournamentWithResults.matches.map(match => [
        match.id,
        getMatchLifecycleState(
          match.kickoffAt,
          Boolean(match.result),
          matchLockOverrides.get(match.id) ?? 'default',
        ),
      ]),
    ),
    [matchLockOverrides, tournamentWithResults.matches],
  );
  const earnedPoints = useMemo(
    () => new Map(
      tournamentWithResults.matches.map(match => {
        const prediction = predMap.get(match.id);
        return [match.id, prediction ? scoreMatchPrediction(match, prediction) : null];
      }),
    ),
    [predMap, tournamentWithResults.matches],
  );

  const currentGroup = tournamentWithResults.groups[currentGroupIndex];
  const currentGroupMatches = useMemo(
    () => groupMatches.filter(match => match.groupId === currentGroup.id),
    [groupMatches, currentGroup.id],
  );
  const groupPredicted = currentGroupMatches.filter(match => predMap.has(match.id)).length;
  const selectedKnockoutMatches = useMemo(
    () => knockoutMatches.filter(match => match.stage === selectedKnockoutStage),
    [knockoutMatches, selectedKnockoutStage],
  );
  const selectedStageMeta = KNOCKOUT_STAGES.find(stage => stage.id === selectedKnockoutStage);

  const handleRandomFill = useCallback(() => {
    for (const match of currentGroupMatches) {
      if (matchStates.get(match.id) !== 'open') continue;
      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 4);
      handleScoreChange(match.id, homeScore, awayScore);
    }
  }, [currentGroupMatches, handleScoreChange, matchStates]);

  const thirdPlaceRanking = useMemo(() => {
    const rows: { groupId: string; teamId: string; played: number; points: number; gd: number; gf: number }[] = [];
    for (const group of tournamentWithResults.groups) {
      const matches = groupMatches.filter(match => match.groupId === group.id);
      const standings = computeGroupStandings(matches, session.predictions);
      if (standings.length >= 3 && standings[2].played > 0) {
        const row = standings[2];
        rows.push({
          groupId: group.id,
          teamId: row.teamId,
          played: row.played,
          points: row.points,
          gd: row.goalDifference,
          gf: row.goalsFor,
        });
      }
    }
    rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    return rows;
  }, [groupMatches, session.predictions, tournamentWithResults.groups]);

  const handleKnockoutStageSelect = useCallback((stage: MatchStage) => {
    setSelectedKnockoutStage(stage);
    setSelectedKnockoutMatchId(knockoutMatches.find(match => match.stage === stage)?.id ?? null);
  }, [knockoutMatches]);

  const handleKnockoutMatchSelect = useCallback((matchId: string) => {
    const match = knockoutMatches.find(item => item.id === matchId);
    if (!match) return;
    setSelectedKnockoutStage(match.stage);
    setSelectedKnockoutMatchId(match.id);
  }, [knockoutMatches]);

  function displayMatchFor(match: Match): Match {
    const slot = knockoutProgression.slots.get(match.id);
    return {
      ...match,
      homeTeamId: slot?.home ?? match.homeTeamId,
      awayTeamId: slot?.away ?? match.awayTeamId,
    };
  }

  function knockoutDisabledReason(match: Match): string {
    if (match.stage === 'round-of-32') return 'Waiting for group results';
    if (match.stage === 'third-place') return 'Waiting for semifinal losers';
    return 'Waiting for previous winners';
  }

  function isKnockoutStructureLocked(match: Match): boolean {
    if (!match.knockout) return false;
    const displayMatch = displayMatchFor(match);
    return !teamMap.has(displayMatch.homeTeamId) || !teamMap.has(displayMatch.awayTeamId);
  }

  function getMatchDisabledReason(match: Match): string | undefined {
    const state = matchStates.get(match.id) ?? 'open';
    if (match.knockout && isKnockoutStructureLocked(match)) {
      return knockoutDisabledReason(match);
    }

    if (state === 'locked') return 'Predictions lock 15 minutes before kickoff.';
    if (state === 'in_progress') return 'This match has started.';
    if (state === 'awaiting_official_result') return 'Awaiting the official final score.';
    if (state === 'completed') return 'Official result recorded.';
    return undefined;
  }

  function isEditableMatch(match: Match): boolean {
    if (match.knockout && isKnockoutStructureLocked(match)) return false;
    return (matchStates.get(match.id) ?? 'open') === 'open';
  }

  const scheduleSections = useMemo(() => {
    const sortedMatches = [...tournamentWithResults.matches].sort((a, b) => {
      const kickoffA = a.kickoffAt ? new Date(a.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
      const kickoffB = b.kickoffAt ? new Date(b.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (kickoffA !== kickoffB) return kickoffA - kickoffB;
      return a.roundOrder - b.roundOrder;
    });

    const sections: Array<{ dateLabel: string; matches: Match[] }> = [];
    for (const match of sortedMatches) {
      const dateLabel = formatSingaporeDateLabel(match.kickoffAt) ?? 'TBD';
      const currentSection = sections.at(-1);
      if (!currentSection || currentSection.dateLabel !== dateLabel) {
        sections.push({ dateLabel, matches: [match] });
        continue;
      }
      currentSection.matches.push(match);
    }

    return sections;
  }, [tournamentWithResults.matches]);
  const filteredScheduleSections = useMemo(() => {
    const sections = scheduleSections
      .map(section => ({
        ...section,
        matches: section.matches.filter(match => {
          const matchState = matchStates.get(match.id) ?? 'open';
          return scheduleFilter === 'past'
            ? matchState === 'completed'
            : matchState !== 'completed';
        }),
      }))
      .filter(section => section.matches.length > 0);

    return scheduleFilter === 'past' ? [...sections].reverse() : sections;
  }, [matchStates, scheduleFilter, scheduleSections]);
  const completedScheduleMatchCount = useMemo(
    () => tournamentWithResults.matches.filter(match => (matchStates.get(match.id) ?? 'open') === 'completed').length,
    [matchStates, tournamentWithResults.matches],
  );

  function renderScheduleSection(section: { dateLabel: string; matches: Match[] }) {
    return (
      <section key={section.dateLabel} className="schedule-day">
        <div className="schedule-day__header">
          <h3>{section.dateLabel}</h3>
          <span>{section.matches.length} matches</span>
        </div>

        <div className="schedule-day__matches">
          {section.matches.map(match => {
            const displayMatch = match.knockout ? displayMatchFor(match) : match;
            const homeTeam = teamMap.get(displayMatch.homeTeamId);
            const awayTeam = teamMap.get(displayMatch.awayTeamId);
            const stageLabel = match.stage === 'group' && match.groupId ? `Group ${match.groupId}` : STAGE_LABELS[match.stage];
            const kickoffLabel = formatSingaporeKickoff(match.kickoffAt);
            const matchState = matchStates.get(match.id) ?? 'open';

            return (
              <article key={match.id} className="schedule-match">
                <div className="schedule-match__meta">
                  <span className="schedule-match__stage">{stageLabel}</span>
                  {kickoffLabel ? (
                    <time className="schedule-match__time" dateTime={match.kickoffAt}>
                      {kickoffLabel}
                    </time>
                  ) : null}
                  <span className={`schedule-match__status schedule-match__status--${matchState}`}>
                    {STATE_LABELS[matchState]}
                  </span>
                </div>
                <ScoreInput
                  match={displayMatch}
                  prediction={predMap.get(match.id)}
                  onScoreChange={handleScoreChange}
                  onAdvancingTeamChange={handleAdvancingTeamChange}
                  homeLabel={homeTeam?.name ?? 'TBD'}
                  awayLabel={awayTeam?.name ?? 'TBD'}
                  homeFifaCode={homeTeam?.fifaCode}
                  awayFifaCode={awayTeam?.fifaCode}
                  disabled={!isEditableMatch(match)}
                  disabledReason={getMatchDisabledReason(match)}
                  scheduleDisplay="hidden"
                  matchState={matchState}
                  officialResult={match.result ?? null}
                  earnedPoints={earnedPoints.get(match.id) ?? null}
                />
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="prediction-workspace" data-testid="prediction-workspace">
      <header className="workspace-header">
        <div className="workspace-summary">
          <div className="workspace-summary__copy">
            <p className="workspace-summary__eyebrow">World Cup Predictions</p>
            <h1 className="workspace-summary__title">{tournamentWithResults.name}</h1>
            <p className="workspace-summary__subtitle">
              {predictedCount}/{totalMatches} matches predicted
            </p>
            {auth.user ? (
              <CloudSyncPanel
                compact
                enabled={auth.enabled}
                loading={auth.loading}
                username={auth.user.username}
                syncStatus={cloudSyncStatus}
                syncMessage={cloudSyncMessage}
                profile={profile}
                profileStatus={profileStatus}
                profileMessage={profileMessage}
                onSignUp={auth.signUp}
                onSignIn={auth.signIn}
                onSignOut={auth.signOut}
                onSaveProfile={handleProfileChange}
              />
            ) : null}
          </div>

          <div className="workspace-summary__stats">
            <section className="workspace-summary__stat" aria-label="Prediction points">
              <span className="workspace-summary__label workspace-summary__label--with-help">
                <span>Points</span>
                <span className="workspace-summary__help">
                  <button
                    className="workspace-summary__help-button"
                    type="button"
                    aria-label="Explain scoring system"
                  >
                    ?
                  </button>
                  <span className="workspace-summary__tooltip" role="tooltip">
                    <span className="workspace-summary__tooltip-line">2 pts: correct result</span>
                    <span className="workspace-summary__tooltip-line">+1 pt: exact score for one team</span>
                    <span className="workspace-summary__tooltip-line">+1 pt: exact score for the other team</span>
                    <span className="workspace-summary__tooltip-line workspace-summary__tooltip-line--total">
                      Your total: {pointsSummary.outcomePoints} result pts, {pointsSummary.exactScorePoints} exact-score pts
                    </span>
                  </span>
                </span>
              </span>
              <strong className="workspace-summary__value" data-testid="prediction-points-total">
                {pointsSummary.totalPoints}
              </strong>
              <small className="workspace-summary__detail">
                {pointsSummary.resultMatchCount > 0
                  ? `${pointsSummary.maximumPoints} points possible so far`
                  : 'Official results will appear here once matches finish.'}
              </small>
            </section>

            <section className="workspace-summary__stat" aria-label="Matches scored">
              <span className="workspace-summary__label">Result %</span>
              <strong className="workspace-summary__value" data-testid="prediction-points-graded">
                {pointsSummary.gradedPredictionCount > 0
                  ? `${Math.round((pointsSummary.correctResultCount / pointsSummary.gradedPredictionCount) * 100)}%`
                  : '—'}
              </strong>
              <small className="workspace-summary__detail">
                {pointsSummary.gradedPredictionCount > 0
                  ? `${pointsSummary.correctResultCount}/${pointsSummary.gradedPredictionCount} correct results`
                  : 'Appears once official results are in.'}
              </small>
            </section>
          </div>
        </div>

        {!auth.user ? (
          <CloudSyncPanel
            enabled={auth.enabled}
            loading={auth.loading}
            username={null}
            syncStatus={cloudSyncStatus}
            syncMessage={cloudSyncMessage}
            profile={profile}
            profileStatus={profileStatus}
            profileMessage={profileMessage}
            onSignUp={auth.signUp}
            onSignIn={auth.signIn}
            onSignOut={auth.signOut}
            onSaveProfile={handleProfileChange}
          />
        ) : null}

        <nav className="workspace-tabs">
          <button className={`workspace-tabs__tab ${activeTab === 'schedule' ? 'workspace-tabs__tab--active' : ''}`} onClick={() => setActiveTab('schedule')} type="button">Schedule</button>
          <button className={`workspace-tabs__tab ${activeTab === 'groups' ? 'workspace-tabs__tab--active' : ''}`} onClick={() => setActiveTab('groups')} type="button">Groups</button>
          <button className={`workspace-tabs__tab ${activeTab === 'third-place' ? 'workspace-tabs__tab--active' : ''}`} onClick={() => setActiveTab('third-place')} type="button">3rd Place</button>
          <button className={`workspace-tabs__tab ${activeTab === 'knockouts' ? 'workspace-tabs__tab--active' : ''}`} onClick={() => setActiveTab('knockouts')} type="button">Knockouts</button>
          <button className={`workspace-tabs__tab ${activeTab === 'leaderboard' ? 'workspace-tabs__tab--active' : ''}`} onClick={() => setActiveTab('leaderboard')} type="button">Leaderboard</button>
          <button className="workspace-tabs__reset" onClick={handleReset} disabled={predictedCount === 0} type="button">Reset</button>
        </nav>
      </header>

      {activeTab === 'groups' && (
        <section className="group-page" data-testid="group-page">
          <div className="group-page__header">
            <button className="group-page__nav" onClick={() => setCurrentGroupIndex(index => index - 1)} disabled={currentGroupIndex === 0} type="button">←</button>
            <div className="group-page__title">
              <h2>{currentGroup.name}</h2>
              <span className="group-page__progress">{groupPredicted}/6</span>
            </div>
            <button className="group-page__nav" onClick={() => setCurrentGroupIndex(index => index + 1)} disabled={currentGroupIndex === tournamentWithResults.groups.length - 1} type="button">→</button>
          </div>

          <div className="group-page__content">
            <GroupStandingsPanel group={currentGroup} matches={groupMatches} predictions={session.predictions} teams={tournamentWithResults.teams} />
            <div className="group-page__matches">
              {currentGroupMatches.map(match => (
                <ScoreInput
                  key={match.id}
                  match={match}
                  prediction={predMap.get(match.id)}
                  onScoreChange={handleScoreChange}
                  onAdvancingTeamChange={handleAdvancingTeamChange}
                  homeLabel={teamMap.get(match.homeTeamId)?.name ?? match.homeTeamId}
                  awayLabel={teamMap.get(match.awayTeamId)?.name ?? match.awayTeamId}
                  homeFifaCode={teamMap.get(match.homeTeamId)?.fifaCode}
                  awayFifaCode={teamMap.get(match.awayTeamId)?.fifaCode}
                  disabled={!isEditableMatch(match)}
                  disabledReason={getMatchDisabledReason(match)}
                  matchState={matchStates.get(match.id)}
                  officialResult={match.result ?? null}
                  earnedPoints={earnedPoints.get(match.id) ?? null}
                />
              ))}
              <button className="btn btn--secondary" onClick={handleRandomFill} type="button">
                Random Scores
              </button>
            </div>
          </div>

          <div className="group-page__dots">
            {tournamentWithResults.groups.map((group, index) => (
              <button key={group.id} className={`group-page__dot ${index === currentGroupIndex ? 'group-page__dot--active' : ''}`} onClick={() => setCurrentGroupIndex(index)} type="button" aria-label={group.name}>{group.id}</button>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'schedule' && (
        <section className="schedule-page" data-testid="schedule-page">
          <div className="schedule-page__header">
            <div>
              <h2 className="schedule-page__title">Match Schedule</h2>
            </div>
            <div className="schedule-page__summary">{predictedCount}/{totalMatches} predicted</div>
          </div>

          <div className="schedule-page__filters" role="tablist" aria-label="Schedule view filter">
            <button
              className={`schedule-page__filter ${scheduleFilter === 'upcoming' ? 'schedule-page__filter--active' : ''}`}
              type="button"
              role="tab"
              aria-selected={scheduleFilter === 'upcoming'}
              onClick={() => setScheduleFilter('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`schedule-page__filter ${scheduleFilter === 'past' ? 'schedule-page__filter--active' : ''}`}
              type="button"
              role="tab"
              aria-selected={scheduleFilter === 'past'}
              onClick={() => setScheduleFilter('past')}
            >
              Past
              {completedScheduleMatchCount > 0 ? (
                <span className="schedule-page__filter-count">{completedScheduleMatchCount}</span>
              ) : null}
            </button>
          </div>

          <div className="schedule-page__days">
            {filteredScheduleSections.map(section => renderScheduleSection(section))}

            {filteredScheduleSections.length === 0 ? (
              <section className="schedule-page__empty">
                <h3>{scheduleFilter === 'past' ? 'No finished matches yet' : 'No upcoming matches left'}</h3>
                <p>
                  {scheduleFilter === 'past'
                    ? 'Once official results come in, you can review your graded picks here.'
                    : 'Everything currently sits in the past view.'}
                </p>
              </section>
            ) : null}
          </div>
        </section>
      )}

      {activeTab === 'third-place' && (
        <section className="third-place-page">
          <h2 className="third-place-page__title">3rd Place Ranking</h2>
          <p className="third-place-page__subtitle">Top 8 advance to the Round of 32</p>
          <div className="table-scroll">
            <table className="standings-table standings-table--compact-mobile">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>Group</th>
                  <th>P</th>
                  <th>Pts</th>
                  <th>GD</th>
                  <th>GF</th>
                </tr>
              </thead>
              <tbody>
                {thirdPlaceRanking.map((row, index) => {
                  const team = teamMap.get(row.teamId);
                  const qualifies = index < 8;
                  return (
                    <tr key={row.teamId} data-qualify={qualifies ? 'yes' : 'no'}>
                      <td>{index + 1}</td>
                      <td>
                        <span className="team-cell">
                          {team?.fifaCode ? <img className="flag-img" src={`/flags/${fifaToIso(team.fifaCode)}.svg`} alt="" width={32} height={22} /> : null}
                          <span className="team-cell__name">{team?.name ?? row.teamId}</span>
                        </span>
                      </td>
                      <td>{row.groupId}</td>
                      <td>{row.played}</td>
                      <td><strong>{row.points}</strong></td>
                      <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                      <td>{row.gf}</td>
                    </tr>
                  );
                })}
                {thirdPlaceRanking.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '32px' }}>Fill in group scores to see 3rd place rankings</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'knockouts' && (
        <section className="prediction-workspace__knockouts">
          <KnockoutBracketView
            knockoutMatches={knockoutMatches}
            groupMatches={groupMatches}
            predictions={session.predictions}
            teams={tournamentWithResults.teams}
            groups={tournamentWithResults.groups}
            progression={knockoutProgression}
            selectedMatchId={selectedKnockoutMatchId ?? undefined}
            onMatchSelect={handleKnockoutMatchSelect}
          />

          <div className="knockout-editor">
            <div className="knockout-editor__rail" aria-label="Choose knockout round">
              {KNOCKOUT_STAGES.map(stage => {
                const stageMatches = knockoutMatches.filter(match => match.stage === stage.id);
                const predictedInStage = stageMatches.filter(match => predMap.has(match.id)).length;
                const structureLocked = stageMatches.some(match => {
                  const slot = knockoutProgression.slots.get(match.id);
                  return !slot?.home || !slot.away || !teamMap.has(slot.home) || !teamMap.has(slot.away);
                });

                return (
                  <button
                    key={stage.id}
                    className={`knockout-editor__stage ${selectedKnockoutStage === stage.id ? 'knockout-editor__stage--active' : ''}`}
                    type="button"
                    onClick={() => handleKnockoutStageSelect(stage.id)}
                  >
                    <span>{stage.shortLabel}</span>
                    <strong>{predictedInStage}/{stageMatches.length}</strong>
                    {structureLocked ? <span className="knockout-editor__lock">Waiting</span> : null}
                  </button>
                );
              })}
            </div>

            <div className="knockout-editor__panel">
              <div className="knockout-editor__header">
                <h3>{selectedStageMeta?.label ?? 'Knockouts'}</h3>
                <span>{selectedKnockoutMatches.filter(match => predMap.has(match.id)).length}/{selectedKnockoutMatches.length} predicted</span>
              </div>

              <div className="knockout-editor__matches">
                {selectedKnockoutMatches.map(match => {
                  const displayMatch = displayMatchFor(match);
                  const homeTeam = teamMap.get(displayMatch.homeTeamId);
                  const awayTeam = teamMap.get(displayMatch.awayTeamId);

                  return (
                    <ScoreInput
                      key={match.id}
                      match={displayMatch}
                      prediction={predMap.get(match.id)}
                      onScoreChange={handleScoreChange}
                      onAdvancingTeamChange={handleAdvancingTeamChange}
                      homeLabel={homeTeam?.name ?? 'TBD'}
                      awayLabel={awayTeam?.name ?? 'TBD'}
                      homeFifaCode={homeTeam?.fifaCode}
                      awayFifaCode={awayTeam?.fifaCode}
                      disabled={!isEditableMatch(match)}
                      disabledReason={getMatchDisabledReason(match)}
                      matchState={matchStates.get(match.id)}
                      officialResult={match.result ?? null}
                      earnedPoints={earnedPoints.get(match.id) ?? null}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'leaderboard' && (
        <section className="leaderboard-page" data-testid="leaderboard-page">
          <div className="leaderboard-page__header">
            <div>
              <h2 className="schedule-page__title">Public Leaderboard</h2>
              <p className="schedule-page__subtitle">{leaderboardMessage}</p>
            </div>
          </div>

          <div className="leaderboard-card">
            {leaderboardStatus === 'ready' && leaderboardEntries.length > 0 ? (
              <div className="table-scroll">
                <table className="standings-table standings-table--compact-mobile">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Points</th>
                      <th>Exact</th>
                      <th>Result %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardEntries.map(entry => (
                      <tr key={entry.userId} data-current-user={entry.isCurrentUser ? 'yes' : 'no'}>
                        <td>{entry.rank}</td>
                        <td>
                          <span className="leaderboard-name">
                            <span className="leaderboard-name__text">{entry.displayName}</span>
                            {entry.isCurrentUser ? <strong className="leaderboard-you">You</strong> : null}
                          </span>
                        </td>
                        <td><strong>{entry.totalPoints}</strong></td>
                        <td>{entry.exactScorePoints}</td>
                        <td>{Math.round(entry.resultAccuracy)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="leaderboard-empty">
                {leaderboardStatus === 'loading' ? 'Loading leaderboard...' : leaderboardMessage}
              </div>
            )}
          </div>
        </section>
      )}

    </div>
  );
}

const FIFA_TO_ISO: Record<string, string> = {
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz', CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct', USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec', NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz', ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no', ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co', ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
};

function fifaToIso(code: string): string {
  return FIFA_TO_ISO[code] ?? code.toLowerCase();
}
