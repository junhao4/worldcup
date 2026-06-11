import type { Match, MatchStage, Tournament } from '../../types/tournament';
import { useMemo, useState, useCallback } from 'react';
import { usePredictionSession } from './usePredictionSession';
import { GroupStandingsPanel } from './components/GroupStandingsPanel';
import { KnockoutBracketView } from './components/KnockoutBracketView';
import { ScoreInput } from './components/ScoreInput';
import { buildResolvedKnockoutProgression, computeGroupStandings } from '../../engine';
import { formatSingaporeDateLabel, formatSingaporeKickoff } from '../../lib/matchTime';

export type WorkspaceTab = 'groups' | 'schedule' | 'third-place' | 'knockouts';

export interface PredictionWorkspaceProps {
  readonly tournament: Tournament;
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

export function PredictionWorkspace({ tournament }: PredictionWorkspaceProps) {
  const {
    session, validation, predictedCount, totalMatches,
    handleScoreChange, handleAdvancingTeamChange, handleReset,
  } = usePredictionSession(tournament);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('groups');
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [selectedKnockoutStage, setSelectedKnockoutStage] = useState<MatchStage>('round-of-32');
  const [selectedKnockoutMatchId, setSelectedKnockoutMatchId] = useState<string | null>(null);

  const teamMap = useMemo(() => new Map(tournament.teams.map(t => [t.id, t])), [tournament.teams]);
  const predMap = useMemo(() => new Map(session.predictions.map(p => [p.matchId, p])), [session.predictions]);
  const groupMatches = useMemo(() => tournament.matches.filter(m => m.stage === 'group'), [tournament.matches]);
  const knockoutMatches = useMemo(() => tournament.matches.filter(m => m.knockout), [tournament.matches]);
  const knockoutProgression = useMemo(
    () => buildResolvedKnockoutProgression(
      knockoutMatches,
      groupMatches,
      session.predictions,
      tournament.groups,
    ),
    [knockoutMatches, groupMatches, session.predictions, tournament.groups],
  );

  const currentGroup = tournament.groups[currentGroupIndex];
  const currentGroupMatches = useMemo(
    () => groupMatches.filter(m => m.groupId === currentGroup.id),
    [groupMatches, currentGroup.id],
  );
  const groupPredicted = currentGroupMatches.filter(m => predMap.has(m.id)).length;
  const selectedKnockoutMatches = useMemo(
    () => knockoutMatches.filter(match => match.stage === selectedKnockoutStage),
    [knockoutMatches, selectedKnockoutStage],
  );
  const selectedStageMeta = KNOCKOUT_STAGES.find(stage => stage.id === selectedKnockoutStage);

  // Random fill for current group
  const handleRandomFill = useCallback(() => {
    for (const match of currentGroupMatches) {
      const h = Math.floor(Math.random() * 4);
      const a = Math.floor(Math.random() * 4);
      handleScoreChange(match.id, h, a);
    }
  }, [currentGroupMatches, handleScoreChange]);

  // Compute all 3rd-place teams for the ranking page
  const thirdPlaceRanking = useMemo(() => {
    const rows: { groupId: string; teamId: string; played: number; points: number; gd: number; gf: number }[] = [];
    for (const group of tournament.groups) {
      const gMatches = groupMatches.filter(m => m.groupId === group.id);
      const standings = computeGroupStandings(gMatches, session.predictions);
      if (standings.length >= 3 && standings[2].played > 0) {
        const r = standings[2];
        rows.push({ groupId: group.id, teamId: r.teamId, played: r.played, points: r.points, gd: r.goalDifference, gf: r.goalsFor });
      }
    }
    rows.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
    return rows;
  }, [tournament.groups, groupMatches, session.predictions]);

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

  function isMatchLocked(match: Match): boolean {
    if (!match.knockout) return false;
    const displayMatch = displayMatchFor(match);
    return !teamMap.has(displayMatch.homeTeamId) || !teamMap.has(displayMatch.awayTeamId);
  }

  const scheduleSections = useMemo(() => {
    const sortedMatches = [...tournament.matches].sort((a, b) => {
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
  }, [tournament.matches]);

  return (
    <div className="prediction-workspace" data-testid="prediction-workspace">
      <header className="workspace-header">
        <nav className="workspace-tabs">
          <button className={`workspace-tabs__tab ${activeTab === 'schedule' ? 'workspace-tabs__tab--active' : ''}`} onClick={() => setActiveTab('schedule')} type="button">Schedule</button>
          <button className={`workspace-tabs__tab ${activeTab === 'groups' ? 'workspace-tabs__tab--active' : ''}`} onClick={() => setActiveTab('groups')} type="button">Groups</button>
          
          <button className={`workspace-tabs__tab ${activeTab === 'third-place' ? 'workspace-tabs__tab--active' : ''}`} onClick={() => setActiveTab('third-place')} type="button">3rd Place</button>
          <button className={`workspace-tabs__tab ${activeTab === 'knockouts' ? 'workspace-tabs__tab--active' : ''}`} onClick={() => setActiveTab('knockouts')} type="button">Knockouts</button>
          <button className="workspace-tabs__reset" onClick={handleReset} disabled={predictedCount === 0} type="button">Reset</button>
        </nav>
      </header>

      {/* Groups */}
      {activeTab === 'groups' && (
        <section className="group-page" data-testid="group-page">
          <div className="group-page__header">
            <button className="group-page__nav" onClick={() => setCurrentGroupIndex(i => i - 1)} disabled={currentGroupIndex === 0} type="button">←</button>
            <div className="group-page__title">
              <h2>{currentGroup.name}</h2>
              <span className="group-page__progress">{groupPredicted}/6</span>
            </div>
            <button className="group-page__nav" onClick={() => setCurrentGroupIndex(i => i + 1)} disabled={currentGroupIndex === tournament.groups.length - 1} type="button">→</button>
          </div>

          <div className="group-page__content">
            <GroupStandingsPanel group={currentGroup} matches={groupMatches} predictions={session.predictions} teams={tournament.teams} />
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
                />
              ))}
              <button className="btn btn--secondary" onClick={handleRandomFill} type="button">
                🎲 Random Scores
              </button>
            </div>
          </div>

          <div className="group-page__dots">
            {tournament.groups.map((g, i) => (
              <button key={g.id} className={`group-page__dot ${i === currentGroupIndex ? 'group-page__dot--active' : ''}`} onClick={() => setCurrentGroupIndex(i)} type="button" aria-label={g.name}>{g.id}</button>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'schedule' && (
        <section className="schedule-page" data-testid="schedule-page">
          <div className="schedule-page__header">
            <div>
              <h2 className="schedule-page__title">Match Schedule</h2>
              <p className="schedule-page__subtitle">Every fixture in Singapore time, ordered chronologically.</p>
            </div>
            <div className="schedule-page__summary">{predictedCount}/{totalMatches} predicted</div>
          </div>

          <div className="schedule-page__days">
            {scheduleSections.map(section => (
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
                    const disabled = match.knockout ? isMatchLocked(match) : false;
                    const stageLabel = match.stage === 'group' && match.groupId
                      ? `Group ${match.groupId}`
                      : STAGE_LABELS[match.stage];
                    const kickoffLabel = formatSingaporeKickoff(match.kickoffAt);

                    return (
                      <article key={match.id} className="schedule-match">
                        <div className="schedule-match__meta">
                          <span className="schedule-match__stage">{stageLabel}</span>

                          {kickoffLabel ? (
                            <time
                              className="schedule-match__time"
                              dateTime={match.kickoffAt}
                            >
                              {kickoffLabel}
                            </time>
                          ) : null}

                          <span className="schedule-match__status">
                            {predMap.has(match.id) ? 'Predicted' : disabled ? 'Locked' : 'Open'}
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
                          disabled={disabled}
                          disabledReason={disabled ? knockoutDisabledReason(match) : undefined}
                          scheduleDisplay="hidden"
                        />
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}

      {/* 3rd Place Ranking */}
      {activeTab === 'third-place' && (
        <section className="third-place-page">
          <h2 className="third-place-page__title">3rd Place Ranking</h2>
          <p className="third-place-page__subtitle">Top 8 advance to the Round of 32</p>
          <table className="standings-table">
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
              {thirdPlaceRanking.map((row, idx) => {
                const team = teamMap.get(row.teamId);
                const qualifies = idx < 8;
                return (
                  <tr key={row.teamId} data-qualify={qualifies ? 'yes' : 'no'}>
                    <td>{idx + 1}</td>
                    <td>
                      <span className="team-cell">
                        {team?.fifaCode ? <img className="flag-img" src={`/flags/${fifaToIso(team.fifaCode)}.svg`} alt="" width={32} height={22} /> : null}
                        {team?.name ?? row.teamId}
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
        </section>
      )}

      {/* Knockouts */}
      {activeTab === 'knockouts' && (
        <section className="prediction-workspace__knockouts">
          <KnockoutBracketView
            knockoutMatches={knockoutMatches}
            groupMatches={groupMatches}
            predictions={session.predictions}
            teams={tournament.teams}
            groups={tournament.groups}
            progression={knockoutProgression}
            selectedMatchId={selectedKnockoutMatchId ?? undefined}
            onMatchSelect={handleKnockoutMatchSelect}
          />

          <div className="knockout-editor">
            <div className="knockout-editor__rail" aria-label="Choose knockout round">
              {KNOCKOUT_STAGES.map(stage => {
                const stageMatches = knockoutMatches.filter(match => match.stage === stage.id);
                const predictedInStage = stageMatches.filter(match => predMap.has(match.id)).length;
                const lockedInStage = stageMatches.some(match => {
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
                    {lockedInStage ? <span className="knockout-editor__lock">Locked</span> : null}
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
                  const disabled = isMatchLocked(match);

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
                      disabled={disabled}
                      disabledReason={disabled ? knockoutDisabledReason(match) : undefined}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Helper to map FIFA code to ISO for flag images
const FIFA_TO_ISO: Record<string, string> = {
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz', CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct', USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec', NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz', ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no', ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co', ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
};
function fifaToIso(code: string): string { return FIFA_TO_ISO[code] ?? code.toLowerCase(); }
