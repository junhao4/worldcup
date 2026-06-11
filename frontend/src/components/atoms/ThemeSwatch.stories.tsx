import type { Meta, StoryObj } from '@storybook/react';
import { ThemeSwatch } from './ThemeSwatch';

const meta = {
  title: 'Atoms/ThemeSwatch',
  component: ThemeSwatch,
  args: {
    themeId: 'classic',
    themeName: 'Classic',
    color: '#1a365d',
  },
} satisfies Meta<typeof ThemeSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { isSelected: true } };
