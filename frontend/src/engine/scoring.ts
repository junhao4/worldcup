import type { Match } from '../types/tournament';
import type { LeaderboardEntry, LeaderboardUser, MatchPrediction, PredictionSession } from '../types/prediction';

export interface PredictionPointsSummary {
  totalPoints: number;
  outcomePoints: number;
  goalDifferencePoints: number;
  exactScorePoints: number;
  correctResultCount: number;
  gradedPredictionCount: number;
  resultMatchCount: number;
  maximumPoints: number;
}

export interface MatchPredictionBreakdown {
  resultPoints: number;
  goalDifferencePoints: number;
  exactScorePoints: number;
  totalPoints: number;
}

type MatchOutcome = 'home' | 'away' | 'draw' | null;

function deriveOutcome(
  match: Match,
  scoreline: { homeScore: number; awayScore: number; advancingTeamId?: string | null },
): MatchOutcome {
  if (scoreline.homeScore > scoreline.awayScore) return 'home';
  if (scoreline.awayScore > scoreline.homeScore) return 'away';

  if (!match.knockout) return 'draw';
  if (scoreline.advancingTeamId === match.homeTeamId) return 'home';
  if (scoreline.advancingTeamId === match.awayTeamId) return 'away';

  return null;
}

export function scoreMatchPredictionBreakdown(
  match: Match,
  prediction: MatchPrediction,
): MatchPredictionBreakdown {
  if (!match.result) {
    return {
      resultPoints: 0,
      goalDifferencePoints: 0,
      exactScorePoints: 0,
      totalPoints: 0,
    };
  }

  const predictedOutcome = deriveOutcome(match, prediction);
  const actualOutcome = deriveOutcome(match, match.result);
  const predictedGoalDifference = prediction.homeScore - prediction.awayScore;
  const actualGoalDifference = match.result.homeScore - match.result.awayScore;
  const hasCorrectResult = predictedOutcome != null && predictedOutcome === actualOutcome;
  const resultPoints = hasCorrectResult ? 2 : 0;

  let goalDifferencePoints = 0;
  if (predictedGoalDifference === actualGoalDifference) {
    goalDifferencePoints = 2;
  } else if (Math.abs(predictedGoalDifference - actualGoalDifference) === 1) {
    goalDifferencePoints = 1;
  }

  const exactScorePoints = (
    prediction.homeScore === match.result.homeScore
    && prediction.awayScore === match.result.awayScore
  ) ? 1 : 0;

  return {
    resultPoints,
    goalDifferencePoints,
    exactScorePoints,
    totalPoints: resultPoints + goalDifferencePoints + exactScorePoints,
  };
}

export function scoreMatchPrediction(match: Match, prediction: MatchPrediction): number {
  return scoreMatchPredictionBreakdown(match, prediction).totalPoints;
}

export function computePredictionPoints(
  matches: Match[],
  predictions: MatchPrediction[],
): PredictionPointsSummary {
  const matchById = new Map(matches.map(match => [match.id, match]));
  const resultMatchCount = matches.filter(match => match.result != null).length;

  let totalPoints = 0;
  let outcomePoints = 0;
  let goalDifferencePoints = 0;
  let exactScorePoints = 0;
  let correctResultCount = 0;
  let gradedPredictionCount = 0;

  for (const prediction of predictions) {
    const match = matchById.get(prediction.matchId);
    if (!match?.result) continue;

    gradedPredictionCount += 1;

    const predictedOutcome = deriveOutcome(match, prediction);
    const actualOutcome = deriveOutcome(match, match.result);
    const predictedGoalDifference = prediction.homeScore - prediction.awayScore;
    const actualGoalDifference = match.result.homeScore - match.result.awayScore;
    const hasCorrectResult = predictedOutcome != null && predictedOutcome === actualOutcome;

    if (hasCorrectResult) {
      outcomePoints += 2;
      correctResultCount += 1;
    }

    if (predictedGoalDifference === actualGoalDifference) {
      goalDifferencePoints += 2;
    } else if (Math.abs(predictedGoalDifference - actualGoalDifference) === 1) {
      goalDifferencePoints += 1;
    }

    if (
      prediction.homeScore === match.result.homeScore
      && prediction.awayScore === match.result.awayScore
    ) {
      exactScorePoints += 1;
    }
  }

  totalPoints = outcomePoints + goalDifferencePoints + exactScorePoints;

  return {
    totalPoints,
    outcomePoints,
    goalDifferencePoints,
    exactScorePoints,
    correctResultCount,
    gradedPredictionCount,
    resultMatchCount,
    maximumPoints: resultMatchCount * 5,
  };
}

export function buildLeaderboardEntries(
  matches: Match[],
  sessions: Array<{ userId: string; session: PredictionSession | null }>,
  users: LeaderboardUser[],
  currentUserId?: string | null,
): LeaderboardEntry[] {
  const leaderboardUsers = new Map(
    users.map(user => [user.userId, user]),
  );
  const sessionMap = new Map(
    sessions.map(entry => [entry.userId, entry.session]),
  );

  const entries: LeaderboardEntry[] = [];

  for (const user of users) {
    const session = sessionMap.get(user.userId);
    const predictions = session?.predictions ?? [];
    const leaderboardUser = leaderboardUsers.get(user.userId);
    if (!leaderboardUser) continue;

    const summary = computePredictionPoints(matches, predictions);
    entries.push({
      userId: user.userId,
      username: leaderboardUser.username,
      totalPoints: summary.totalPoints,
      outcomePoints: summary.outcomePoints,
      exactScorePoints: summary.exactScorePoints,
      correctResultCount: summary.correctResultCount,
      resultAccuracy: summary.gradedPredictionCount > 0
        ? (summary.correctResultCount / summary.gradedPredictionCount) * 100
        : 0,
      gradedPredictionCount: summary.gradedPredictionCount,
      resultMatchCount: summary.resultMatchCount,
      rank: 0,
      isCurrentUser: currentUserId === user.userId,
    });
  }

  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactScorePoints !== a.exactScorePoints) return b.exactScorePoints - a.exactScorePoints;
    if (b.resultAccuracy !== a.resultAccuracy) return b.resultAccuracy - a.resultAccuracy;
    return a.username.localeCompare(b.username);
  });

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
