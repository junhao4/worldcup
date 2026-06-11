import type { Match, StandingsRow, Group } from '../types/tournament';
import type { MatchPrediction } from '../types/prediction';
import { computeGroupStandings } from './standings';

/**
 * 2026 World Cup Round of 32 seeding.
 * Top 2 from each group (24) + best 8 third-place teams (8) = 32.
 * 
 * R32 matchup structure (FIFA's bracket):
 * Match 1:  1A vs 3C/D/E/F
 * Match 2:  1B vs 3A/D/E/F
 * Match 3:  1C vs 3A/B/F
 * Match 4:  1D vs 3B/E/F
 * Match 5:  1E vs 3A/B/C/D
 * Match 6:  1F vs 3C/D/E
 * Match 7:  1G vs 3H/I/J
 * Match 8:  1H vs 3G/I/J/K
 * Match 9:  1I vs 3G/H/K/L
 * Match 10: 1J vs 3G/H/I/L
 * Match 11: 1K vs 3H/I/J/L
 * Match 12: 1L vs 3I/J/K
 * Match 13: 2A vs 2F
 * Match 14: 2B vs 2E
 * Match 15: 2C vs 2D
 * Match 16: 2G vs 2L
 * Match 17: 2H vs 2K
 * Match 18: 2I vs 2J
 * 
 * Simplified: we assign group winners (1st) and runners-up (2nd) to fixed slots.
 * Third-place teams are ranked and assigned to remaining slots.
 */

export interface KnockoutSlot {
  matchId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

export function deriveKnockoutParticipants(
  groups: Group[],
  groupMatches: Match[],
  predictions: MatchPrediction[],
): Map<string, { home: string | null; away: string | null }> {
  // Compute standings for all groups
  const groupStandings = new Map<string, StandingsRow[]>();
  for (const group of groups) {
    const matches = groupMatches.filter(m => m.groupId === group.id);
    const standings = computeGroupStandings(matches, predictions);
    groupStandings.set(group.id, standings);
  }

  // Get team at position for each group (0-indexed)
  const pos = (groupId: string, position: number): string | null => {
    const rows = groupStandings.get(groupId);
    if (!rows || rows.length <= position) return null;
    // Only return if that team has played at least 1 match
    return rows[position].played > 0 ? rows[position].teamId : null;
  };

  // Collect all third-place teams and rank them
  const thirdPlaceTeams: { teamId: string; groupId: string; row: StandingsRow }[] = [];
  for (const group of groups) {
    const rows = groupStandings.get(group.id);
    if (rows && rows.length >= 3 && rows[2].played > 0) {
      thirdPlaceTeams.push({ teamId: rows[2].teamId, groupId: group.id, row: rows[2] });
    }
  }

  // Sort third-place teams by points, then GD, then goals scored
  thirdPlaceTeams.sort((a, b) => {
    if (b.row.points !== a.row.points) return b.row.points - a.row.points;
    if (b.row.goalDifference !== a.row.goalDifference) return b.row.goalDifference - a.row.goalDifference;
    return b.row.goalsFor - a.row.goalsFor;
  });

  // Best 8 third-place teams qualify
  const qualifiedThird = thirdPlaceTeams.slice(0, 8);
  const thirdMap = new Map(qualifiedThird.map((t, i) => [`3rd-${i + 1}`, t.teamId]));

  // Build the R32 matchups
  // Simplified bracket: group winners play 3rd place, runners-up play each other
  const slots = new Map<string, { home: string | null; away: string | null }>();

  // Winners vs 3rd place (matches 1-12)
  const winnerSlots: [string, string, number][] = [
    ['r32-1', 'A', 0], ['r32-2', 'B', 1], ['r32-3', 'C', 2], ['r32-4', 'D', 3],
    ['r32-5', 'E', 4], ['r32-6', 'F', 5], ['r32-7', 'G', 6], ['r32-8', 'H', 7],
    ['r32-9', 'I', 0], ['r32-10', 'J', 1], ['r32-11', 'K', 2], ['r32-12', 'L', 3],
  ];

  for (const [matchId, groupId, thirdIdx] of winnerSlots) {
    slots.set(matchId, {
      home: pos(groupId, 0),
      away: thirdMap.get(`3rd-${thirdIdx + 1}`) ?? null,
    });
  }

  // Runners-up vs runners-up (matches 13-16)  
  const runnerSlots: [string, string, string][] = [
    ['r32-13', 'A', 'F'], ['r32-14', 'B', 'E'],
    ['r32-15', 'C', 'D'], ['r32-16', 'G', 'L'],
  ];

  for (const [matchId, g1, g2] of runnerSlots) {
    slots.set(matchId, { home: pos(g1, 1), away: pos(g2, 1) });
  }

  return slots;
}
