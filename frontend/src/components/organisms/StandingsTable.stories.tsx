import type { Meta, StoryObj } from '@storybook/react';
import { standingsRows } from '../../data/mockData';
import { StandingsTable } from './StandingsTable';

const meta = {
  title: 'Organisms/StandingsTable',
  component: StandingsTable,
  args: {
    rows: standingsRows,
    title: 'Standings: Group A',
  },
} satisfies Meta<typeof StandingsTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
