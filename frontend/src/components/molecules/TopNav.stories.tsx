import type { Meta, StoryObj } from '@storybook/react';
import { navigationItems } from '../../data/mockData';
import { TopNav } from './TopNav';

const meta = {
  title: 'Molecules/TopNav',
  component: TopNav,
  args: {
    activeItem: 'Predictions',
    items: navigationItems,
    primaryActionLabel: 'Export',
  },
} satisfies Meta<typeof TopNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
