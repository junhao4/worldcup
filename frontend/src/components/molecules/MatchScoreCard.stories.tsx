import type { Meta, StoryObj } from '@storybook/react';
import { MatchScoreCard } from './MatchScoreCard';
import type { Match } from '../../types/tournament';
import type { MatchPrediction } from '../../types/prediction';

const liveGroupMatch: Match = {
  id: 'g-a-1',
  homeTeamId: 'BRA',
  awayTeamId: 'GER',
  stage: 'group',
  groupId: 'A',
  knockout: false,
  matchday: 1,
};

const liveKnockoutMatch: Match = {
  id: 'ko-1',
  homeTeamId: 'ARG',
  awayTeamId: 'FRA',
  stage: 'round-of-32',
  groupId: null,
  knockout: true,
  matchday: 4,
};

const scoredPrediction: MatchPrediction = {
  matchId: 'g-a-1',
  homeScore: 2,
  awayScore: 1,
  advancingTeamId: null,
};

const tiePrediction: MatchPrediction = {
  matchId: 'ko-1',
  homeScore: 1,
  awayScore: 1,
  advancingTeamId: 'ARG',
};

const meta = {
  title: 'Molecules/MatchScoreCard',
  component: MatchScoreCard,
  args: {
    liveMatch: liveGroupMatch,
    homeLabel: 'Brazil',
    awayLabel: 'Germany',
    onScoreChange: () => {},
  },
} satisfies Meta<typeof MatchScoreCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveUnpredicted: Story = {};

export const LivePredicted: Story = {
  args: { livePrediction: scoredPrediction },
};

export const KnockoutTieWithWinner: Story = {
  args: {
    liveMatch: liveKnockoutMatch,
    livePrediction: tiePrediction,
    homeLabel: 'Argentina',
    awayLabel: 'France',
  },
};

export const KnockoutNoPrediction: Story = {
  args: {
    liveMatch: liveKnockoutMatch,
    homeLabel: 'Argentina',
    awayLabel: 'France',
  },
};
