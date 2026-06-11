import type { BracketMatch } from '../../data/mockData';
import { FlagBadge } from '../atoms/FlagBadge';
import { ScoreBox } from '../atoms/ScoreBox';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

export interface BracketMatchCardProps extends Readonly<{
  match: BracketMatch;
}> {}

export function BracketMatchCard({ match }: BracketMatchCardProps) {
  return (
    <Card variant="bracket">
      <div className="bracket-card__row">
        <Badge variant="gold">{match.round}</Badge>
        <strong>{match.winner} advances</strong>
      </div>
      <div className="bracket-card__row">
        <span className="team-cell">
          <FlagBadge code={match.home.flag} label={match.home.name} />
          {match.home.name}
        </span>
        <ScoreBox label={match.home.name} score={match.home.score} />
      </div>
      <div className="bracket-card__row">
        <span className="team-cell">
          <FlagBadge code={match.away.flag} label={match.away.name} />
          {match.away.name}
        </span>
        <ScoreBox label={match.away.name} score={match.away.score} />
      </div>
    </Card>
  );
}
