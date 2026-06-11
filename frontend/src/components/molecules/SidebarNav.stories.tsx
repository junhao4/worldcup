import type { Meta, StoryObj } from '@storybook/react';
import { navigationItems } from '../../data/mockData';
import { SidebarNav } from './SidebarNav';

const meta = {
  title: 'Molecules/SidebarNav',
  component: SidebarNav,
  args: {
    activeItem: 'Predictions',
    completion: 65,
    items: navigationItems,
  },
} satisfies Meta<typeof SidebarNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
