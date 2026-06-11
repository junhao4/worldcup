import type { Tournament } from '../types/tournament';
import type { MatchPrediction, PredictionValidationResult } from '../types/prediction';
import { buildResolvedKnockoutProgression } from './knockoutProgression';

/** Validate a prediction set against the tournament structure (KB: 07f early return) */
export function validatePredictionSession(
  tournament: Tournament,
  predictions: MatchPrediction[],
): PredictionValidationResult {
  const predByMatch = new Map(predictions.map(p => [p.matchId, p]));
  const groupMatches = tournament.matches.filter(match => match.stage === 'group');
  const knockoutMatches = tournament.matches.filter(match => match.knockout);
  const progression = buildResolvedKnockoutProgression(
    knockoutMatches,
    groupMatches,
    predictions,
    tournament.groups,
  );
  const missingMatchIds: string[] = [];
  const messages: string[] = [];
  let valid = true;

  for (const match of tournament.matches) {
    const pred = predByMatch.get(match.id);
    if (!pred) {
      missingMatchIds.push(match.id);
      continue;
    }

    // Knockout tie without advancing team selection
    if (match.knockout && pred.homeScore === pred.awayScore) {
      const slot = progression.slots.get(match.id);
      const hasValidAdvancingTeam =
        pred.advancingTeamId != null &&
        (pred.advancingTeamId === slot?.home || pred.advancingTeamId === slot?.away);

      if (!hasValidAdvancingTeam) {
        valid = false;
        messages.push(`Match ${match.id}: knockout tie requires an advancing team`);
      }
    }
  }

  const complete = missingMatchIds.length === 0 && valid;
  const champion = complete ? progression.champion : null;

  return {
    complete,
    valid: valid && missingMatchIds.length === 0,
    championTeamId: champion,
    missingMatchIds,
    resetMatchIds: [],
    messages,
  };
}
