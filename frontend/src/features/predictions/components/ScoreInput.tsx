import { useState, useEffect } from 'react';
import type { Match, MatchResult } from '../../../types/tournament';
import type { MatchLifecycleState, MatchPrediction } from '../../../types/prediction';
import { AdvancementPicker } from './AdvancementPicker';
import { formatSingaporeKickoff } from '../../../lib/matchTime';

export interface ScoreInputProps {
  readonly match: Match;
  readonly prediction: MatchPrediction | undefined;
  readonly onScoreChange: (matchId: string, homeScore: number, awayScore: number) => void;
  readonly onAdvancingTeamChange?: (matchId: string, teamId: string) => void;
  readonly homeLabel: string;
  readonly awayLabel: string;
  readonly homeFifaCode?: string;
  readonly awayFifaCode?: string;
  readonly disabled?: boolean;
  readonly disabledReason?: string;
  readonly scheduleDisplay?: 'full' | 'time-only' | 'hidden';
  readonly matchState?: MatchLifecycleState;
  readonly officialResult?: MatchResult | null;
  readonly earnedPoints?: number | null;
}

/** Map FIFA codes to ISO 3166-1 alpha-2 for flag images */
const fifaToIso: Record<string, string> = {
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz', CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct', USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec', NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz', ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no', ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co', ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
};

const STAGE_LABELS: Record<Match['stage'], string> = {
  group: 'Group Stage',
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  quarterfinal: 'Quarterfinal',
  semifinal: 'Semifinal',
  'third-place': 'Third Place',
  final: 'Final',
};

function FlagImg({ fifaCode, name }: { fifaCode?: string; name: string }) {
  const iso = fifaCode ? fifaToIso[fifaCode] : undefined;
  if (!iso) return <span className="flag">{(fifaCode ?? name.slice(0, 3)).toUpperCase()}</span>;
  return (
    <img
      className="flag-img"
      src={`/flags/${iso}.svg`}
      alt={`${name} flag`}
      width={40}
      height={30}
      loading="lazy"
      onError={(e) => {
        // Replace broken image with text fallback
        const span = document.createElement('span');
        span.className = 'flag';
        span.textContent = (fifaCode ?? '').toUpperCase();
        (e.target as HTMLElement).replaceWith(span);
      }}
    />
  );
}

export function ScoreInput({
  match, prediction, onScoreChange, onAdvancingTeamChange,
  homeLabel, awayLabel, homeFifaCode, awayFifaCode,
  disabled = false, disabledReason, scheduleDisplay = 'full',
  matchState = 'open', officialResult, earnedPoints = null,
}: ScoreInputProps) {
  // Local string state so user can type freely (empty, partial)
  const [homeText, setHomeText] = useState(prediction?.homeScore?.toString() ?? '');
  const [awayText, setAwayText] = useState(prediction?.awayScore?.toString() ?? '');

  // Sync from prediction or official result changes
  useEffect(() => {
    setHomeText(prediction?.homeScore?.toString() ?? '');
    setAwayText(prediction?.awayScore?.toString() ?? '');
  }, [prediction?.awayScore, prediction?.homeScore]);

  const needsWinner =
    !disabled && match.knockout && prediction != null && prediction.homeScore === prediction.awayScore;
  const kickoffLabel = scheduleDisplay === 'hidden' ? null : formatSingaporeKickoff(match.kickoffAt);
  const stageLabel = match.stage === 'group' && match.groupId ? `Group ${match.groupId}` : STAGE_LABELS[match.stage];

  function commitScores(home: string, away: string) {
    const h = parseInt(home, 10);
    const a = parseInt(away, 10);
    // Only fire when BOTH are valid numbers
    if (!isNaN(h) && !isNaN(a) && h >= 0 && a >= 0) {
      onScoreChange(match.id, h, a);
    }
  }

  function handleHome(value: string) {
    setHomeText(value);
    commitScores(value, awayText);
  }

  function handleAway(value: string) {
    setAwayText(value);
    commitScores(homeText, value);
  }

  return (
    <div className={`score-card ${disabled ? 'score-card--disabled' : ''}`} data-testid={`score-input-${match.id}`}>
      {disabled && disabledReason ? (
        <div className="score-card__status">{disabledReason}</div>
      ) : null}
      {kickoffLabel ? (
        <div className={`score-card__schedule ${scheduleDisplay === 'time-only' ? 'score-card__schedule--time-only' : ''}`}>
          {scheduleDisplay === 'full' ? <span>{stageLabel}</span> : null}
          <time dateTime={match.kickoffAt}>{kickoffLabel}</time>
        </div>
      ) : null}
      <div className="score-card__teams">
        <div className="score-card__team">
          <FlagImg fifaCode={homeFifaCode} name={homeLabel} />
          <span>{homeLabel}</span>
        </div>
        <div className="score-card__scoreline">
          <input
            className="score-box--input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={`${homeLabel} score`}
            value={homeText}
            onChange={(e) => handleHome(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="–"
            disabled={disabled}
          />
          <span>:</span>
          <input
            className="score-box--input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label={`${awayLabel} score`}
            value={awayText}
            onChange={(e) => handleAway(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="–"
            disabled={disabled}
          />
        </div>
        <div className="score-card__team">
          <FlagImg fifaCode={awayFifaCode} name={awayLabel} />
          <span>{awayLabel}</span>
        </div>
      </div>
      {needsWinner && onAdvancingTeamChange ? (
        <AdvancementPicker
          matchId={match.id}
          homeTeamId={match.homeTeamId}
          awayTeamId={match.awayTeamId}
          homeLabel={homeLabel}
          awayLabel={awayLabel}
          selectedTeamId={prediction.advancingTeamId}
          onSelect={onAdvancingTeamChange}
        />
      ) : null}
      {officialResult ? (
        <div className="score-card__result" data-testid={`official-result-${match.id}`}>
          <div className="score-card__result-row">
            <span className="score-card__result-label">Official result</span>
            <strong>{officialResult.homeScore}:{officialResult.awayScore}</strong>
          </div>
          {earnedPoints != null ? (
            <div className="score-card__result-row">
              <span className="score-card__result-label">Points earned</span>
              <strong>{earnedPoints}/4</strong>
            </div>
          ) : null}
        </div>
      ) : null}
      {!officialResult && (matchState === 'in_progress' || matchState === 'awaiting_official_result') ? (
        <div className="score-card__result score-card__result--pending">
          <div className="score-card__result-row">
            <span className="score-card__result-label">
              {matchState === 'in_progress' ? 'Match in progress' : 'Official result pending'}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
