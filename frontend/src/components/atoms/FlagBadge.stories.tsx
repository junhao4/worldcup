import type { Meta, StoryObj } from '@storybook/react';
import { FlagBadge } from './FlagBadge';

const meta = {
  title: 'Atoms/FlagBadge',
  component: FlagBadge,
  args: {
    code: 'BR',
    label: 'Brazil',
  },
} satisfies Meta<typeof FlagBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
