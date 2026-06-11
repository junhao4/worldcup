import type { Meta, StoryObj } from '@storybook/react';
import { navigationItems } from '../../data/mockData';
import { AppShell } from './AppShell';

const meta = {
  title: 'Organisms/AppShell',
  component: AppShell,
  args: {
    activeItem: 'Predictions',
    completion: 65,
    navItems: navigationItems,
    primaryActionLabel: 'Export',
    children: <section className="hero-panel"><h1>Shared app shell</h1></section>,
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
