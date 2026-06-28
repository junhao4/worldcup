import { THIRD_PLACE_ROUND_OF_32_ASSIGNMENTS } from '../data/thirdPlaceRoundOf32Assignments';
import type { Match, StandingsRow, Group } from '../types/tournament';
import type { MatchPrediction } from '../types/prediction';
import { computeGroupStandings } from './standings';

export interface KnockoutSlot {
  matchId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

type ThirdPlaceWinnerGroup = 'A' | 'B' | 'D' | 'E' | 'G' | 'I' | 'K' | 'L';

const THIRD_PLACE_WINNER_SLOTS: Record<ThirdPlaceWinnerGroup, string> = {
  A: 'r32-11',
  B: 'r32-15',
  D: 'r32-7',
  E: 'r32-1',
  G: 'r32-8',
  I: 'r32-2',
  K: 'r32-16',
  L: 'r32-12',
};

const FIXED_ROUND_OF_32_SLOTS: Array<[string, string, number, string, number]> = [
  ['r32-3', 'A', 1, 'B', 1],
  ['r32-4', 'F', 0, 'C', 1],
  ['r32-5', 'K', 1, 'L', 1],
  ['r32-6', 'H', 0, 'J', 1],
  ['r32-9', 'C', 0, 'F', 1],
  ['r32-10', 'E', 1, 'I', 1],
  ['r32-13', 'J', 0, 'H', 1],
  ['r32-14', 'D', 1, 'G', 1],
];

function thirdPlaceAssignmentKey(groupIds: string[]): string | null {
  if (groupIds.length !== 8) return null;
  return [...groupIds].sort().join('');
}

function groupStandingsById(
  groups: Group[],
  groupMatches: Match[],
  predictions: MatchPrediction[],
): Map<string, StandingsRow[]> {
  const standings = new Map<string, StandingsRow[]>();
  for (const group of groups) {
    const matches = groupMatches.filter((match) => match.groupId === group.id);
    standings.set(group.id, computeGroupStandings(matches, predictions, 'combined'));
  }
  return standings;
}

function positionLookup(standingsByGroup: Map<string, StandingsRow[]>) {
  return (groupId: string, position: number): string | null => {
    const rows = standingsByGroup.get(groupId);
    if (!rows || rows.length <= position) return null;
    return rows[position].played > 0 ? rows[position].teamId : null;
  };
}

export function deriveKnockoutParticipants(
  groups: Group[],
  groupMatches: Match[],
  predictions: MatchPrediction[],
): Map<string, { home: string | null; away: string | null }> {
  const standingsByGroup = groupStandingsById(groups, groupMatches, predictions);
  const pos = positionLookup(standingsByGroup);

  const thirdPlaceTeams: Array<{ groupId: string; teamId: string; row: StandingsRow }> = [];
  for (const group of groups) {
    const rows = standingsByGroup.get(group.id);
    if (rows && rows.length >= 3 && rows[2].played > 0) {
      thirdPlaceTeams.push({ groupId: group.id, teamId: rows[2].teamId, row: rows[2] });
    }
  }

  thirdPlaceTeams.sort((a, b) => {
    if (b.row.points !== a.row.points) return b.row.points - a.row.points;
    if (b.row.goalDifference !== a.row.goalDifference) return b.row.goalDifference - a.row.goalDifference;
    if (b.row.goalsFor !== a.row.goalsFor) return b.row.goalsFor - a.row.goalsFor;
    return a.groupId.localeCompare(b.groupId);
  });

  const qualifiedThird = thirdPlaceTeams.slice(0, 8);
  const qualifiedThirdByGroup = new Map(qualifiedThird.map((team) => [team.groupId, team.teamId]));
  const assignmentKey = thirdPlaceAssignmentKey(qualifiedThird.map((team) => team.groupId));
  const assignment = assignmentKey ? THIRD_PLACE_ROUND_OF_32_ASSIGNMENTS[assignmentKey] : null;

  const slots = new Map<string, { home: string | null; away: string | null }>();

  for (const [matchId, homeGroup, homePosition, awayGroup, awayPosition] of FIXED_ROUND_OF_32_SLOTS) {
    slots.set(matchId, {
      home: pos(homeGroup, homePosition),
      away: pos(awayGroup, awayPosition),
    });
  }

  for (const [winnerGroup, matchId] of Object.entries(THIRD_PLACE_WINNER_SLOTS) as Array<[ThirdPlaceWinnerGroup, string]>) {
    const assignedThirdGroup = assignment?.[winnerGroup] ?? null;
    slots.set(matchId, {
      home: pos(winnerGroup, 0),
      away: assignedThirdGroup ? (qualifiedThirdByGroup.get(assignedThirdGroup) ?? null) : null,
    });
  }

  return slots;
}
