import { useMemo } from 'react';
import type { Match, Team, Group } from '../../../types/tournament';
import type { MatchPrediction } from '../../../types/prediction';
import { buildResolvedKnockoutProgression } from '../../../engine';
import type { ResolvedKnockoutProgression } from '../../../engine';
import { formatSingaporeKickoff } from '../../../lib/matchTime';

const fifaToIso: Record<string, string> = {
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz', CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct', USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec', NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz', ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no', ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co', ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
};

export interface KnockoutBracketViewProps {
  readonly knockoutMatches: Match[];
  readonly groupMatches: Match[];
  readonly predictions: MatchPrediction[];
  readonly teams: Team[];
  readonly groups: Group[];
  readonly progression?: ResolvedKnockoutProgression;
  readonly selectedMatchId?: string;
  readonly onMatchSelect?: (matchId: string) => void;
}

export function KnockoutBracketView({
  knockoutMatches, groupMatches, predictions, teams, groups,
  progression: providedProgression, selectedMatchId, onMatchSelect,
}: KnockoutBracketViewProps) {
  const teamMap = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams]);
  const predMap = useMemo(() => new Map(predictions.map(prediction => [prediction.matchId, prediction])), [predictions]);

  const progression = useMemo(
    () => providedProgression ?? buildResolvedKnockoutProgression(
      knockoutMatches,
      groupMatches,
      predictions,
      groups,
    ),
    [providedProgression, knockoutMatches, groupMatches, predictions, groups],
  );

  function teamDisplay(id: string | null | undefined) {
    if (!id) return <span className="bracket-tbd">TBD</span>;
    const team = teamMap.get(id);
    if (!team) return <span className="bracket-tbd">{id}</span>;
    const iso = fifaToIso[team.fifaCode];
    return (
      <span className="bracket-team">
        {iso ? <img className="flag-img" src={`/flags/${iso}.svg`} alt="" width={32} height={22} /> : null}
        <span>{team.name}</span>
      </span>
    );
  }

  // Group knockout matches by stage
  const stages = ['round-of-32', 'round-of-16', 'quarterfinal', 'semifinal', 'final'] as const;
  const stageLabels: Record<string, string> = {
    'round-of-32': 'Round of 32',
    'round-of-16': 'Round of 16',
    'quarterfinal': 'Quarter-Finals',
    'semifinal': 'Semi-Finals',
    'final': 'Final',
  };

  return (
    <div className="knockout-bracket" data-testid="knockout-bracket">
      {progression.champion ? (
        <div className="bracket-champion" data-testid="champion-display">
          {teamMap.get(progression.champion)?.name ?? progression.champion}
        </div>
      ) : null}

      {stages.map(stage => {
        const stageMatches = knockoutMatches.filter(m => m.stage === stage);
        if (stageMatches.length === 0) return null;
        return (
          <div key={stage} className="bracket-stage">
            <h3 className="bracket-stage__title">{stageLabels[stage]}</h3>
            <div className="bracket-stage__matches">
              {stageMatches.map(match => {
                const slot = progression.slots.get(match.id);
                const homeId = slot?.home ?? null;
                const awayId = slot?.away ?? null;
                const winner = progression.winners.get(match.id);
                const prediction = predMap.get(match.id);
                const showScore = prediction != null && homeId != null && awayId != null;
                const className = [
                  'bracket-match',
                  winner ? 'bracket-match--decided' : '',
                  selectedMatchId === match.id ? 'bracket-match--selected' : '',
                  onMatchSelect ? 'bracket-match--button' : '',
                ].filter(Boolean).join(' ');
                const kickoffLabel = formatSingaporeKickoff(match.kickoffAt);
                const content = (
                  <>
                    {kickoffLabel ? (
                      <time className="bracket-match__schedule" dateTime={match.kickoffAt}>
                        {kickoffLabel}
                      </time>
                    ) : null}
                    <div className={`bracket-match__team ${winner === homeId ? 'bracket-match__team--winner' : ''}`}>
                      {teamDisplay(homeId)}
                      {showScore ? (
                        <span
                          className={`bracket-match__score ${winner === homeId ? 'bracket-match__score--winner' : ''}`}
                          data-testid={`bracket-score-${match.id}-home`}
                        >
                          {prediction.homeScore}
                        </span>
                      ) : null}
                    </div>
                    <div className="bracket-match__vs">vs</div>
                    <div className={`bracket-match__team ${winner === awayId ? 'bracket-match__team--winner' : ''}`}>
                      {teamDisplay(awayId)}
                      {showScore ? (
                        <span
                          className={`bracket-match__score ${winner === awayId ? 'bracket-match__score--winner' : ''}`}
                          data-testid={`bracket-score-${match.id}-away`}
                        >
                          {prediction.awayScore}
                        </span>
                      ) : null}
                    </div>
                    {winner ? (
                      <div className="bracket-match__winner">
                        {teamMap.get(winner)?.name ?? winner} advances
                      </div>
                    ) : null}
                  </>
                );

                if (onMatchSelect) {
                  return (
                    <button
                      key={match.id}
                      className={className}
                      type="button"
                      onClick={() => onMatchSelect(match.id)}
                      aria-pressed={selectedMatchId === match.id}
                    >
                      {content}
                    </button>
                  );
                }

                return <div key={match.id} className={className}>{content}</div>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
