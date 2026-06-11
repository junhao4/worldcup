import { describe, it, expect, vi, beforeAll } from 'vitest';
import { buildExportModel } from '../../../src/features/predictions/export/buildExportModel';
import { exportPredictionCard } from '../../../src/features/predictions/export/exportPredictionCard';
import type { PredictionSession, PredictionValidationResult } from '../../../src/types/prediction';
import type { Tournament } from '../../../src/types/tournament';

// Mock canvas API for jsdom
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

// Minimal fixtures
const minimalTournament: Tournament = {
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
  card: { title: 'My Prediction', creatorName: 'Tester', themeId: 'classic', championTeamId: 'arg' },
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
  messages: [],
};

describe('buildExportModel', () => {
  it('returns null when prediction is incomplete (completion gating)', () => {
    const result = buildExportModel(minimalTournament, completeSession, incompleteValidation);
    expect(result).toBeNull();
  });

  it('builds export model with correct champion and title for a complete prediction', () => {
    const result = buildExportModel(minimalTournament, completeSession, completeValidation);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('My Prediction');
    expect(result!.championName).toBe('Argentina');
    expect(result!.creatorName).toBe('Tester');
  });

  it('uses tournament name in fileName', () => {
    const result = buildExportModel(minimalTournament, completeSession, completeValidation);
    expect(result!.fileName).toContain('2026fifaworldcup');
  });
});

describe('exportPredictionCard', () => {
  it('returns ExportImage with correct fileName from the export model', async () => {
    const model = buildExportModel(minimalTournament, completeSession, completeValidation)!;
    const result = await exportPredictionCard(model);
    expect(result.status).toBe('ready');
    expect(result.fileName).toMatch(/prediction\.png$/);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it('generates a data URL for the PNG', async () => {
    const model = buildExportModel(minimalTournament, completeSession, completeValidation)!;
    const result = await exportPredictionCard(model);
    expect(result.dataUrl).toMatch(/^data:image\/png/);
  });
});
