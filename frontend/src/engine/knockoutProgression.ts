import type { Match, Group } from '../types/tournament';
import type { MatchPrediction } from '../types/prediction';
import { deriveKnockoutParticipants } from './knockoutSeeding';

export interface KnockoutMatchSlot {
  home: string | null;
  away: string | null;
}

export interface ResolvedKnockoutProgression {
  slots: Map<string, KnockoutMatchSlot>;
  winners: Map<string, string>;
  losers: Map<string, string>;
  champion: string | null;
}

const PLACEHOLDER_PATTERN = /-(home|away)$/;

function isPlaceholder(teamId: string): boolean {
  return PLACEHOLDER_PATTERN.test(teamId);
}

function fallbackSlot(match: Match): KnockoutMatchSlot {
  return {
    home: isPlaceholder(match.homeTeamId) ? null : match.homeTeamId,
    away: isPlaceholder(match.awayTeamId) ? null : match.awayTeamId,
  };
}

function pairedSources(prefix: string, index: number): [string, string] {
  return [`${prefix}-${index * 2 - 1}`, `${prefix}-${index * 2}`];
}

function sourceMatchesFor(match: Match): [string, string] | null {
  const index = Number(match.id.split('-').at(-1));
  if (!Number.isFinite(index)) return null;

  if (match.stage === 'round-of-16') return pairedSources('r32', index);
  if (match.stage === 'quarterfinal') return pairedSources('r16', index);
  if (match.stage === 'semifinal') return pairedSources('qf', index);
  if (match.stage === 'final') return ['sf-1', 'sf-2'];
  if (match.stage === 'third-place') return ['sf-1', 'sf-2'];
  return null;
}

function resolveOutcome(
  slot: KnockoutMatchSlot,
  prediction: MatchPrediction | undefined,
): { winner: string | null; loser: string | null } {
  if (!prediction || !slot.home || !slot.away) {
    return { winner: null, loser: null };
  }

  if (prediction.homeScore > prediction.awayScore) {
    return { winner: slot.home, loser: slot.away };
  }

  if (prediction.awayScore > prediction.homeScore) {
    return { winner: slot.away, loser: slot.home };
  }

  if (prediction.advancingTeamId === slot.home) {
    return { winner: slot.home, loser: slot.away };
  }

  if (prediction.advancingTeamId === slot.away) {
    return { winner: slot.away, loser: slot.home };
  }

  return { winner: null, loser: null };
}

export function buildResolvedKnockoutProgression(
  knockoutMatches: Match[],
  groupMatches: Match[],
  predictions: MatchPrediction[],
  groups: Group[],
): ResolvedKnockoutProgression {
  const predByMatch = new Map(predictions.map(prediction => [prediction.matchId, prediction]));
  const r32Slots = deriveKnockoutParticipants(groups, groupMatches, predictions);
  const slots = new Map<string, KnockoutMatchSlot>();
  const winners = new Map<string, string>();
  const losers = new Map<string, string>();

  const orderedMatches = [...knockoutMatches].sort((a, b) => a.roundOrder - b.roundOrder);

  for (const match of orderedMatches) {
    const sources = sourceMatchesFor(match);
    let slot: KnockoutMatchSlot;

    if (match.stage === 'round-of-32') {
      const derived = r32Slots.get(match.id);
      const fallback = fallbackSlot(match);
      slot = {
        home: derived?.home ?? fallback.home,
        away: derived?.away ?? fallback.away,
      };
    } else if (sources) {
      const sourceMap = match.stage === 'third-place' ? losers : winners;
      slot = {
        home: sourceMap.get(sources[0]) ?? null,
        away: sourceMap.get(sources[1]) ?? null,
      };

      const fallback = fallbackSlot(match);
      slot = {
        home: slot.home ?? fallback.home,
        away: slot.away ?? fallback.away,
      };
    } else {
      slot = fallbackSlot(match);
    }

    slots.set(match.id, slot);

    const { winner, loser } = resolveOutcome(slot, predByMatch.get(match.id));
    if (winner) winners.set(match.id, winner);
    if (loser) losers.set(match.id, loser);
  }

  const finalMatch = knockoutMatches.find(match => match.stage === 'final');
  const champion = finalMatch ? (winners.get(finalMatch.id) ?? null) : null;

  return { slots, winners, losers, champion };
}
