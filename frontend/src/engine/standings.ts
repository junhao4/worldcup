import type { Match, StandingsRow } from '../types/tournament';
import type { MatchPrediction } from '../types/prediction';

export type GroupStandingsMode = 'predicted' | 'actual' | 'combined';

function getAppliedScoreline(
  match: Match,
  prediction: MatchPrediction | undefined,
  mode: GroupStandingsMode,
) {
  if (mode === 'actual') {
    if (!match.result) return null;
    return {
      homeScore: match.result.homeScore,
      awayScore: match.result.awayScore,
    };
  }

  if (mode === 'combined' && match.result) {
    return {
      homeScore: match.result.homeScore,
      awayScore: match.result.awayScore,
    };
  }

  if (!prediction) return null;

  return {
    homeScore: prediction.homeScore,
    awayScore: prediction.awayScore,
  };
}

export function computeGroupStandings(
  groupMatches: Match[],
  predictions: MatchPrediction[],
  mode: GroupStandingsMode = 'combined',
): StandingsRow[] {
  // Build index map for O(1) prediction lookups (KB: 07a)
  const predByMatch = new Map(predictions.map(p => [p.matchId, p]));

  // Collect unique team IDs from group matches
  const teamIds = new Set<string>();
  for (const m of groupMatches) {
    teamIds.add(m.homeTeamId);
    teamIds.add(m.awayTeamId);
  }

  // Initialize standings
  const rows = new Map<string, StandingsRow>();
  for (const id of teamIds) {
    rows.set(id, {
      teamId: id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const match of groupMatches) {
    const scoreline = getAppliedScoreline(match, predByMatch.get(match.id), mode);
    if (!scoreline) continue;

    const home = rows.get(match.homeTeamId)!;
    const away = rows.get(match.awayTeamId)!;

    home.played++;
    away.played++;
    home.goalsFor += scoreline.homeScore;
    home.goalsAgainst += scoreline.awayScore;
    away.goalsFor += scoreline.awayScore;
    away.goalsAgainst += scoreline.homeScore;

    if (scoreline.homeScore > scoreline.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (scoreline.homeScore < scoreline.awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  return sortStandings([...rows.values()]);
}

/** Sort standings: points desc, goal difference desc, goals for desc (KB: 07k immutable sort) */
export function sortStandings(rows: StandingsRow[]): StandingsRow[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}
