import type { MatchPrediction } from '../../data/mockData';
import type { Match } from '../../types/tournament';
import type { MatchPrediction as LivePrediction } from '../../types/prediction';
import { FlagBadge } from '../atoms/FlagBadge';
import { ScoreBox } from '../atoms/ScoreBox';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

export interface MatchScoreCardProps extends Readonly<{
  match?: MatchPrediction;
  liveMatch?: Match;
  livePrediction?: LivePrediction;
  homeLabel?: string;
  awayLabel?: string;
  onScoreChange?: (matchId: string, homeScore: number, awayScore: number) => void;
}> {}

export function MatchScoreCard({ match, liveMatch, livePrediction, homeLabel, awayLabel, onScoreChange }: MatchScoreCardProps) {
  // Live mode
  if (liveMatch) {
    const isPredicted = livePrediction != null;
    return (
      <Card className={isPredicted ? 'score-card--predicted' : undefined} variant="score">
        <div className="score-card__meta">
          <span>{liveMatch.stage}</span>
          <Badge variant={isPredicted ? 'success' : 'gold'}>{isPredicted ? 'Predicted' : 'Needs pick'}</Badge>
        </div>
        <div className="score-card__teams">
          <div className="score-card__team">
            <strong>{homeLabel ?? liveMatch.homeTeamId}</strong>
          </div>
          <div className="score-card__scoreline">
            <input
              type="number"
              min={0}
              className="score-box score-box--input"
              aria-label={`${homeLabel ?? liveMatch.homeTeamId} score`}
              value={livePrediction?.homeScore ?? ''}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) onScoreChange?.(liveMatch.id, v, livePrediction?.awayScore ?? 0);
              }}
            />
            <span>:</span>
            <input
              type="number"
              min={0}
              className="score-box score-box--input"
              aria-label={`${awayLabel ?? liveMatch.awayTeamId} score`}
              value={livePrediction?.awayScore ?? ''}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) onScoreChange?.(liveMatch.id, livePrediction?.homeScore ?? 0, v);
              }}
            />
          </div>
          <div className="score-card__team">
            <strong>{awayLabel ?? liveMatch.awayTeamId}</strong>
          </div>
        </div>
      </Card>
    );
  }

  // Static/mock mode (backward compat)
  if (!match) return null;
  return (
    <Card className={match.status === 'predicted' ? 'score-card--predicted' : undefined} variant="score">
      <div className="score-card__meta">
        <span>{match.date}</span>
        <Badge variant={match.status === 'predicted' ? 'success' : 'gold'}>{match.status === 'predicted' ? 'Predicted' : 'Needs pick'}</Badge>
      </div>
      <div className="score-card__teams">
        <div className="score-card__team">
          <FlagBadge code={match.home.flag} label={match.home.name} />
          <strong>{match.home.name}</strong>
        </div>
        <div className="score-card__scoreline">
          <ScoreBox label={match.home.name} score={match.home.score} />
          <span>:</span>
          <ScoreBox label={match.away.name} score={match.away.score} />
        </div>
        <div className="score-card__team">
          <FlagBadge code={match.away.flag} label={match.away.name} />
          <strong>{match.away.name}</strong>
        </div>
      </div>
      <p className="score-card__venue">{match.stage} at {match.venue}</p>
    </Card>
  );
}
