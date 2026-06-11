import { describe, it, expect } from 'vitest';
import { computeGroupStandings, sortStandings } from '../../../src/engine/standings';
import { resolveKnockoutWinner, buildBracketProgression } from '../../../src/engine/bracket';
import { validatePredictionSession } from '../../../src/engine/validation';
import type { MatchPrediction } from '../../../src/types/prediction';
import type { Match, StandingsRow } from '../../../src/types/tournament';
import { tournament2026 } from '../../../src/data/tournament2026';
import { formatSingaporeKickoff } from '../../../src/lib/matchTime';

describe('computeGroupStandings', () => {
  const groupAMatches = tournament2026.matches.filter(m => m.groupId === 'A');

  it('returns empty standings when no predictions exist', () => {
    const standings = computeGroupStandings(groupAMatches, []);
    expect(standings).toHaveLength(4);
    for (const row of standings) {
      expect(row.points).toBe(0);
      expect(row.played).toBe(0);
    }
  });

  it('awards 3 points for a win and 1 for a draw', () => {
    const predictions: MatchPrediction[] = [
      { matchId: groupAMatches[0].id, homeScore: 2, awayScore: 0, advancingTeamId: null },
      { matchId: groupAMatches[1].id, homeScore: 1, awayScore: 1, advancingTeamId: null },
    ];
    const standings = computeGroupStandings(groupAMatches, predictions);
    const homeWinner = standings.find(r => r.teamId === groupAMatches[0].homeTeamId)!;
    expect(homeWinner.points).toBe(3);
    expect(homeWinner.won).toBe(1);

    // Both teams in match 2 get 1 point each
    const drawTeam1 = standings.find(r => r.teamId === groupAMatches[1].homeTeamId)!;
    const drawTeam2 = standings.find(r => r.teamId === groupAMatches[1].awayTeamId)!;
    expect(drawTeam1.points).toBe(1);
    expect(drawTeam2.points).toBe(1);
  });

  it('computes goal difference correctly', () => {
    const predictions: MatchPrediction[] = [
      { matchId: groupAMatches[0].id, homeScore: 3, awayScore: 1, advancingTeamId: null },
    ];
    const standings = computeGroupStandings(groupAMatches, predictions);
    const home = standings.find(r => r.teamId === groupAMatches[0].homeTeamId)!;
    expect(home.goalsFor).toBe(3);
    expect(home.goalsAgainst).toBe(1);
    expect(home.goalDifference).toBe(2);
  });
});

describe('sortStandings', () => {
  it('sorts by points descending first', () => {
    const rows: StandingsRow[] = [
      { teamId: 'a', played: 3, won: 1, drawn: 0, lost: 2, goalsFor: 2, goalsAgainst: 4, goalDifference: -2, points: 3 },
      { teamId: 'b', played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 6, goalsAgainst: 1, goalDifference: 5, points: 9 },
    ];
    const sorted = sortStandings(rows);
    expect(sorted[0].teamId).toBe('b');
  });

  it('uses goal difference as tiebreaker', () => {
    const rows: StandingsRow[] = [
      { teamId: 'a', played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 3, goalsAgainst: 2, goalDifference: 1, points: 6 },
      { teamId: 'b', played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 1, goalDifference: 4, points: 6 },
    ];
    const sorted = sortStandings(rows);
    expect(sorted[0].teamId).toBe('b');
  });

  it('uses goals for as second tiebreaker', () => {
    const rows: StandingsRow[] = [
      { teamId: 'a', played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 4, goalsAgainst: 2, goalDifference: 2, points: 6 },
      { teamId: 'b', played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, goalDifference: 2, points: 6 },
    ];
    const sorted = sortStandings(rows);
    expect(sorted[0].teamId).toBe('b');
  });
});

describe('resolveKnockoutWinner', () => {
  it('returns the home team when home score is higher', () => {
    const prediction: MatchPrediction = { matchId: 'r32-1', homeScore: 2, awayScore: 1, advancingTeamId: null };
    const match: Match = { id: 'r32-1', stage: 'round-of-32', roundOrder: 73, groupId: null, homeTeamId: 'usa', awayTeamId: 'bra', knockout: true };
    expect(resolveKnockoutWinner(match, prediction)).toBe('usa');
  });

  it('returns the away team when away score is higher', () => {
    const prediction: MatchPrediction = { matchId: 'r32-1', homeScore: 0, awayScore: 3, advancingTeamId: null };
    const match: Match = { id: 'r32-1', stage: 'round-of-32', roundOrder: 73, groupId: null, homeTeamId: 'usa', awayTeamId: 'bra', knockout: true };
    expect(resolveKnockoutWinner(match, prediction)).toBe('bra');
  });

  it('returns advancingTeamId on a tie', () => {
    const prediction: MatchPrediction = { matchId: 'r32-1', homeScore: 1, awayScore: 1, advancingTeamId: 'bra' };
    const match: Match = { id: 'r32-1', stage: 'round-of-32', roundOrder: 73, groupId: null, homeTeamId: 'usa', awayTeamId: 'bra', knockout: true };
    expect(resolveKnockoutWinner(match, prediction)).toBe('bra');
  });

  it('returns null when tied without an advancing team selection', () => {
    const prediction: MatchPrediction = { matchId: 'r32-1', homeScore: 1, awayScore: 1, advancingTeamId: null };
    const match: Match = { id: 'r32-1', stage: 'round-of-32', roundOrder: 73, groupId: null, homeTeamId: 'usa', awayTeamId: 'bra', knockout: true };
    expect(resolveKnockoutWinner(match, prediction)).toBeNull();
  });
});

describe('buildBracketProgression', () => {
  it('returns an empty progression when no knockout predictions exist', () => {
    const result = buildBracketProgression(tournament2026.matches.filter(m => m.knockout), []);
    expect(result.champion).toBeNull();
  });
});

describe('validatePredictionSession', () => {
  it('reports incomplete when predictions are missing', () => {
    const result = validatePredictionSession(tournament2026, []);
    expect(result.complete).toBe(false);
    expect(result.valid).toBe(false);
    expect(result.missingMatchIds.length).toBeGreaterThan(0);
  });

  it('reports a tied knockout without advancingTeamId as invalid', () => {
    const knockoutMatch = tournament2026.matches.find(m => m.knockout)!;
    const predictions: MatchPrediction[] = [
      { matchId: knockoutMatch.id, homeScore: 1, awayScore: 1, advancingTeamId: null },
    ];
    const result = validatePredictionSession(tournament2026, predictions);
    expect(result.valid).toBe(false);
    expect(result.messages.length).toBeGreaterThan(0);
  });
});

describe('tournament schedule', () => {
  it('provides Singapore kickoff times for every match', () => {
    expect(tournament2026.matches).toHaveLength(104);
    expect(tournament2026.matches.every(match => match.kickoffAt != null)).toBe(true);
    expect(tournament2026.matches.every(match => match.kickoffTimeZone === 'Asia/Singapore')).toBe(true);
  });

  it('formats kickoff times in Singapore time', () => {
    const openingMatch = tournament2026.matches.find(match => match.id === 'g-A-1');
    const final = tournament2026.matches.find(match => match.id === 'final-1');

    expect(formatSingaporeKickoff(openingMatch?.kickoffAt)).toBe('12 Jun, 3:00 AM SGT');
    expect(formatSingaporeKickoff(final?.kickoffAt)).toBe('20 Jul, 3:00 AM SGT');
  });
});
