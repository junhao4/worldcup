import type { Meta, StoryObj } from '@storybook/react';
import { SettingsPanel } from './SettingsPanel';
import { DEFAULT_CARD } from '../../types/prediction';

const meta = {
  title: 'Organisms/SettingsPanel',
  component: SettingsPanel,
  args: {
    card: DEFAULT_CARD,
    onCardChange: () => {},
  },
} satisfies Meta<typeof SettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCreatorName: Story = {
  args: { card: { ...DEFAULT_CARD, creatorName: 'Jun Hao' } },
};

export const MidnightSelected: Story = {
  args: { card: { ...DEFAULT_CARD, themeId: 'midnight' } },
};

export const CustomTitle: Story = {
  args: { card: { ...DEFAULT_CARD, title: 'My Bold Prediction' } },
};

export const FullyPersonalized: Story = {
  args: { card: { ...DEFAULT_CARD, title: 'Fiesta Prediction', creatorName: 'World Cup Fan', themeId: 'fiesta' } },
};
