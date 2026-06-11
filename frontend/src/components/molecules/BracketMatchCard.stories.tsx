import type { Meta, StoryObj } from '@storybook/react';
import { bracketMatches } from '../../data/mockData';
import { BracketMatchCard } from './BracketMatchCard';

const meta = {
  title: 'Molecules/BracketMatchCard',
  component: BracketMatchCard,
  args: {
    match: bracketMatches[0],
  },
} satisfies Meta<typeof BracketMatchCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Quarterfinal: Story = {};
export const Semifinal: Story = { args: { match: bracketMatches[1] } };
