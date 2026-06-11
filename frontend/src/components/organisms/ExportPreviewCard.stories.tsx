import type { Meta, StoryObj } from '@storybook/react';
import { ExportPreviewCard } from './ExportPreviewCard';
import type { ExportModel } from '../../features/predictions/export/buildExportModel';

const baseModel: ExportModel = {
  title: 'My 2026 World Cup Path',
  creatorName: 'Jun Hao',
  themeId: 'classic',
  championName: 'Brazil',
  championFifaCode: 'BRA',
  fileName: 'worldcup2026-prediction.png',
  width: 1200,
  height: 630,
};

const meta = {
  title: 'Organisms/ExportPreviewCard',
  component: ExportPreviewCard,
  args: { model: baseModel },
} satisfies Meta<typeof ExportPreviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { model: null } };

export const MidnightTheme: Story = {
  args: { model: { ...baseModel, themeId: 'midnight', championName: 'Germany', championFifaCode: 'GER' } },
};

export const FiestaTheme: Story = {
  args: { model: { ...baseModel, themeId: 'fiesta', championName: 'Argentina', championFifaCode: 'ARG' } },
};

export const WithoutCreator: Story = {
  args: { model: { ...baseModel, creatorName: null } },
};

export const LongTitle: Story = {
  args: { model: { ...baseModel, title: 'My Super Detailed World Cup 2026 Prediction Card Title' } },
};
