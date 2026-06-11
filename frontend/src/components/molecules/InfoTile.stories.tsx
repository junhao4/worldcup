import type { Meta, StoryObj } from '@storybook/react';
import { infoTiles } from '../../data/mockData';
import { InfoTile } from './InfoTile';

const meta = {
  title: 'Molecules/InfoTile',
  component: InfoTile,
  args: {
    tile: infoTiles[0],
  },
} satisfies Meta<typeof InfoTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
