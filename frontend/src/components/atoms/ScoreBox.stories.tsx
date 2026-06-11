import type { Meta, StoryObj } from '@storybook/react';
import { ScoreBox } from './ScoreBox';

const meta = {
  title: 'Atoms/ScoreBox',
  component: ScoreBox,
  args: {
    label: 'Brazil',
    score: 3,
  },
} satisfies Meta<typeof ScoreBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
