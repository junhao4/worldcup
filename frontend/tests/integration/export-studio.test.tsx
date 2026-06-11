import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportStudio } from '../../src/features/predictions/components/ExportStudio';
import type { PredictionSession, PredictionValidationResult } from '../../src/types/prediction';
import type { Tournament } from '../../src/types/tournament';

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillStyle: '',
    font: '',
    textAlign: '',
    fillRect: vi.fn(),
    fillText: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');
});

const tournament: Tournament = {
  id: 'world-cup-2026',
  name: '2026 FIFA World Cup',
  year: 2026,
  teams: [
    { id: 'arg', name: 'Argentina', fifaCode: 'ARG', confederation: 'CONMEBOL', flagAsset: '/flags/arg.svg' },
    { id: 'bra', name: 'Brazil', fifaCode: 'BRA', confederation: 'CONMEBOL', flagAsset: '/flags/bra.svg' },
  ],
  groups: Array.from({ length: 12 }, (_, i) => ({ id: `g${i}`, name: `Group ${String.fromCharCode(65 + i)}`, teamIds: ['arg', 'bra', 'arg', 'bra'] })),
  matches: Array.from({ length: 104 }, (_, i) => ({
    id: `m${i}`,
    stage: i === 103 ? 'final' as const : 'group' as const,
    roundOrder: i,
    groupId: i < 96 ? 'g0' : null,
    homeTeamId: 'arg',
    awayTeamId: 'bra',
    knockout: i >= 96,
  })),
};

const completeSession: PredictionSession = {
  id: 'test-session',
  tournamentId: 'world-cup-2026',
  predictions: Array.from({ length: 104 }, (_, i) => ({
    matchId: `m${i}`,
    homeScore: 2,
    awayScore: 1,
    advancingTeamId: null,
  })),
  card: { title: 'My Final Bracket', creatorName: 'Tester', themeId: 'classic', championTeamId: 'arg' },
  updatedAt: '2026-06-10T00:00:00.000Z',
  schemaVersion: 'prediction-session:v1',
};

const completeValidation: PredictionValidationResult = {
  complete: true,
  valid: true,
  championTeamId: 'arg',
  missingMatchIds: [],
  resetMatchIds: [],
  messages: [],
};

const incompleteValidation: PredictionValidationResult = {
  complete: false,
  valid: false,
  championTeamId: null,
  missingMatchIds: ['m50'],
  resetMatchIds: [],
  messages: ['Prediction incomplete'],
};

describe('ExportStudio', () => {
  it('shows disabled export when prediction is incomplete', () => {
    render(
      <ExportStudio
        tournament={tournament}
        session={completeSession}
        validation={incompleteValidation}
      />,
    );
    const downloadBtn = screen.getByRole('button', { name: /download/i });
    expect(downloadBtn).toBeDisabled();
  });

  it('shows preview with champion name when prediction is complete', () => {
    render(
      <ExportStudio
        tournament={tournament}
        session={completeSession}
        validation={completeValidation}
      />,
    );
    expect(screen.getByText(/Argentina/)).toBeInTheDocument();
    expect(screen.getByText(/My Final Bracket/)).toBeInTheDocument();
  });

  it('triggers download on button click for complete prediction', async () => {
    const user = userEvent.setup();
    render(
      <ExportStudio
        tournament={tournament}
        session={completeSession}
        validation={completeValidation}
      />,
    );
    const downloadBtn = screen.getByRole('button', { name: /download/i });
    expect(downloadBtn).not.toBeDisabled();
    await user.click(downloadBtn);
    // After click, export feedback should show
    expect(await screen.findByText(/downloaded/i)).toBeInTheDocument();
  });
});
