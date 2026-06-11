import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardContent } from './card';

const meta = {
  title: 'UI/Card',
  component: Card,
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Reusable card</CardTitle>
        </CardHeader>
        <CardContent>Panel content extracted from the newest Stitch screens.</CardContent>
      </>
    ),
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Panel: Story = {};
export const Bracket: Story = { args: { variant: 'bracket', children: 'Bracket card shell' } };
export const Score: Story = { args: { variant: 'score', children: 'Score card shell' } };
