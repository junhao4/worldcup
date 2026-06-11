import type { Meta, StoryObj } from '@storybook/react';
import { ProgressSummary } from './ProgressSummary';

const meta = {
  title: 'Molecules/ProgressSummary',
  component: ProgressSummary,
  args: {
    label: 'Prediction progress',
    value: 65,
  },
} satisfies Meta<typeof ProgressSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
