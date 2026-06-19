import { describe, it, expect } from 'vitest';
import { computeGroupStandings, sortStandings } from '../../../src/engine/standings';
import { resolveKnockoutWinner, buildBracketProgression } from '../../../src/engine/bracket';
import { validatePredictionSession } from '../../../src/engine/validation';
import { buildLeaderboardEntries, computePredictionPoints, scoreMatchPrediction } from '../../../src/engine/scoring';
import type { LeaderboardUser, MatchPrediction, PredictionSession } from '../../../src/types/prediction';
import type { Match, StandingsRow } from '../../../src/types/tournament';
import { tournament2026 } from '../../../src/data/tournament2026';
import { formatSingaporeKickoff } from '../../../src/lib/matchTime';
import { SCHEMA_VERSION } from '../../../src/types/prediction';

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

describe('prediction scoring', () => {
  const completedGroupMatch: Match = {
    id: 'g-A-1',
    stage: 'group',
    roundOrder: 1,
    groupId: 'A',
    homeTeamId: 'usa',
    awayTeamId: 'mex',
    knockout: false,
    result: { homeScore: 2, awayScore: 1 },
  };

  const completedKnockoutMatch: Match = {
    id: 'r32-1',
    stage: 'round-of-32',
    roundOrder: 73,
    groupId: null,
    homeTeamId: 'usa',
    awayTeamId: 'mex',
    knockout: true,
    result: { homeScore: 1, awayScore: 1, advancingTeamId: 'usa' },
  };

  it('awards 5 points for an exact prediction', () => {
    const prediction: MatchPrediction = {
      matchId: 'g-A-1',
      homeScore: 2,
      awayScore: 1,
      advancingTeamId: null,
    };

    expect(scoreMatchPrediction(completedGroupMatch, prediction)).toBe(5);
  });

  it('awards 2 points for correct outcome only', () => {
    const prediction: MatchPrediction = {
      matchId: 'g-A-1',
      homeScore: 4,
      awayScore: 0,
      advancingTeamId: null,
    };

    expect(scoreMatchPrediction(completedGroupMatch, prediction)).toBe(2);
  });

  it('counts knockout tiebreak advancement plus exact goal difference and exact scoreline', () => {
    const prediction: MatchPrediction = {
      matchId: 'r32-1',
      homeScore: 1,
      awayScore: 1,
      advancingTeamId: 'usa',
    };

    expect(scoreMatchPrediction(completedKnockoutMatch, prediction)).toBe(5);
  });

  it('awards 4 points for correct result and exact goal difference without exact scoreline', () => {
    const prediction: MatchPrediction = {
      matchId: 'g-A-1',
      homeScore: 3,
      awayScore: 2,
      advancingTeamId: null,
    };

    expect(scoreMatchPrediction(completedGroupMatch, prediction)).toBe(4);
  });

  it('awards 3 points when goal difference is within one in the correct direction', () => {
    const prediction: MatchPrediction = {
      matchId: 'g-A-1',
      homeScore: 4,
      awayScore: 2,
      advancingTeamId: null,
    };

    expect(scoreMatchPrediction(completedGroupMatch, prediction)).toBe(3);
  });

  it('awards goal-difference points even when the result is wrong', () => {
    const prediction: MatchPrediction = {
      matchId: 'r32-1',
      homeScore: 1,
      awayScore: 2,
      advancingTeamId: null,
    };

    expect(scoreMatchPrediction(completedKnockoutMatch, prediction)).toBe(1);
  });

  it('summarizes points across graded matches only', () => {
    const pendingMatch: Match = {
      id: 'g-A-2',
      stage: 'group',
      roundOrder: 2,
      groupId: 'A',
      homeTeamId: 'bra',
      awayTeamId: 'arg',
      knockout: false,
    };

    const summary = computePredictionPoints(
      [completedGroupMatch, completedKnockoutMatch, pendingMatch],
      [
        { matchId: 'g-A-1', homeScore: 2, awayScore: 1, advancingTeamId: null },
        { matchId: 'r32-1', homeScore: 1, awayScore: 0, advancingTeamId: null },
        { matchId: 'g-A-2', homeScore: 3, awayScore: 2, advancingTeamId: null },
      ],
    );

    expect(summary.totalPoints).toBe(8);
    expect(summary.outcomePoints).toBe(4);
    expect(summary.goalDifferencePoints).toBe(3);
    expect(summary.exactScorePoints).toBe(1);
    expect(summary.gradedPredictionCount).toBe(2);
    expect(summary.resultMatchCount).toBe(2);
    expect(summary.maximumPoints).toBe(10);
  });

  it('builds leaderboard entries sorted by score and exact picks', () => {
    const matches: Match[] = [
      completedGroupMatch,
      completedKnockoutMatch,
    ];

    const makeSession = (id: string, predictions: MatchPrediction[]): PredictionSession => ({
      id,
      tournamentId: 'world-cup-2026',
      predictions,
      card: {
        title: 'Predictions',
        creatorName: null,
        themeId: 'classic',
        championTeamId: null,
      },
      updatedAt: '2026-06-11T00:00:00.000Z',
      schemaVersion: SCHEMA_VERSION,
    });

    const sessions = [
      {
        userId: 'user-a',
        session: makeSession('session-a', [
          { matchId: 'g-A-1', homeScore: 2, awayScore: 1, advancingTeamId: null },
          { matchId: 'r32-1', homeScore: 1, awayScore: 1, advancingTeamId: 'usa' },
        ]),
      },
      {
        userId: 'user-b',
        session: makeSession('session-b', [
          { matchId: 'g-A-1', homeScore: 3, awayScore: 0, advancingTeamId: null },
          { matchId: 'r32-1', homeScore: 0, awayScore: 0, advancingTeamId: 'usa' },
        ]),
      },
      {
        userId: 'user-c',
        session: makeSession('session-c', [
          { matchId: 'g-A-1', homeScore: 2, awayScore: 1, advancingTeamId: null },
        ]),
      },
    ];

    const users: LeaderboardUser[] = [
      { userId: 'user-a', username: 'alice' },
      { userId: 'user-b', username: 'bob' },
      { userId: 'user-c', username: 'chris' },
    ];

    const leaderboard = buildLeaderboardEntries(matches, sessions, users, 'user-b');

    expect(leaderboard).toHaveLength(3);
    expect(leaderboard[0]).toMatchObject({
      rank: 1,
      userId: 'user-a',
      username: 'alice',
      totalPoints: 10,
      exactScorePoints: 2,
      outcomePoints: 4,
      correctResultCount: 2,
      resultAccuracy: 100,
      isCurrentUser: false,
    });
    expect(leaderboard[1]).toMatchObject({
      rank: 2,
      userId: 'user-b',
      username: 'bob',
      totalPoints: 6,
      exactScorePoints: 0,
      outcomePoints: 4,
      correctResultCount: 2,
      resultAccuracy: 100,
      isCurrentUser: true,
    });
    expect(leaderboard[2]).toMatchObject({
      rank: 3,
      userId: 'user-c',
      username: 'chris',
      totalPoints: 5,
      exactScorePoints: 1,
      outcomePoints: 2,
      correctResultCount: 1,
      resultAccuracy: 100,
      isCurrentUser: false,
    });
  });

  it('uses higher correct-result percentage as the next tiebreak after exact points', () => {
    const matches: Match[] = [
      completedGroupMatch,
      completedKnockoutMatch,
    ];

    const makeSession = (id: string, predictions: MatchPrediction[]): PredictionSession => ({
      id,
      tournamentId: 'world-cup-2026',
      predictions,
      card: {
        title: 'Predictions',
        creatorName: null,
        themeId: 'classic',
        championTeamId: null,
      },
      updatedAt: '2026-06-11T00:00:00.000Z',
      schemaVersion: SCHEMA_VERSION,
    });

    const sessions = [
      {
        userId: 'user-a',
        session: makeSession('session-a', [
          { matchId: 'g-A-1', homeScore: 2, awayScore: 1, advancingTeamId: null },
        ]),
      },
      {
        userId: 'user-b',
        session: makeSession('session-b', [
          { matchId: 'g-A-1', homeScore: 2, awayScore: 1, advancingTeamId: null },
          { matchId: 'r32-1', homeScore: 0, awayScore: 2, advancingTeamId: 'mex' },
        ]),
      },
    ];

    const users: LeaderboardUser[] = [
      { userId: 'user-a', username: 'alice' },
      { userId: 'user-b', username: 'bob' },
    ];

    const leaderboard = buildLeaderboardEntries(matches, sessions, users);

    expect(leaderboard[0]).toMatchObject({
      rank: 1,
      userId: 'user-a',
      totalPoints: 5,
      exactScorePoints: 1,
      correctResultCount: 1,
      gradedPredictionCount: 1,
      resultAccuracy: 100,
    });
    expect(leaderboard[1]).toMatchObject({
      rank: 2,
      userId: 'user-b',
      totalPoints: 5,
      exactScorePoints: 1,
      correctResultCount: 1,
      gradedPredictionCount: 2,
      resultAccuracy: 50,
    });
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
