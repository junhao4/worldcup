import type { Match } from '../types/tournament';
import type { MatchPrediction } from '../types/prediction';

export interface BracketProgression {
  winners: Map<string, string>; // matchId -> winning teamId
  champion: string | null;
}

/** Resolve the winner of a knockout match from a prediction (KB: 07f early return) */
export function resolveKnockoutWinner(
  match: Match,
  prediction: MatchPrediction,
): string | null {
  const scoreline = match.result ?? prediction;
  if (scoreline.homeScore > scoreline.awayScore) return match.homeTeamId;
  if (scoreline.awayScore > scoreline.homeScore) return match.awayTeamId;
  return scoreline.advancingTeamId ?? null;
}

/** Build bracket progression from knockout matches and predictions */
export function buildBracketProgression(
  knockoutMatches: Match[],
  predictions: MatchPrediction[],
): BracketProgression {
  const predByMatch = new Map(predictions.map(p => [p.matchId, p]));
  const winners = new Map<string, string>();

  for (const match of knockoutMatches) {
    const pred = predByMatch.get(match.id);
    if (!pred) continue;
    const winner = resolveKnockoutWinner(match, pred);
    if (winner) {
      winners.set(match.id, winner);
    }
  }

  const finalMatch = knockoutMatches.find(m => m.stage === 'final');
  const champion = finalMatch ? (winners.get(finalMatch.id) ?? null) : null;

  return { winners, champion };
}
