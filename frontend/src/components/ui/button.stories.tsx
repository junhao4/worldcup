import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'UI/Button',
  component: Button,
  args: {
    children: 'Export predictions',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', children: 'Save draft' } };
export const Gold: Story = { args: { variant: 'gold', children: 'Download PNG' } };
export const Outline: Story = { args: { variant: 'outline', children: 'Edit card' } };
