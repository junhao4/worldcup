/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  savePredictionSession,
  loadPredictionSession,
  clearPredictionSession,
  updateStoredCardMetadata,
  STORAGE_KEY,
} from '../../../src/persistence/predictionStorage';
import { migrateSession } from '../../../src/persistence/predictionMigrations';
import type { PredictionSession } from '../../../src/types/prediction';
import { SCHEMA_VERSION } from '../../../src/types/prediction';

const validSession: PredictionSession = {
  id: 'resume-test-1',
  tournamentId: 'world-cup-2026',
  predictions: [
    { matchId: 'g-A-1', homeScore: 2, awayScore: 1, advancingTeamId: null },
    { matchId: 'g-A-2', homeScore: 0, awayScore: 0, advancingTeamId: null },
  ],
  card: {
    title: 'My Custom Title',
    creatorName: 'Test User',
    themeId: 'midnight',
    championTeamId: null,
  },
  updatedAt: '2026-06-10T08:00:00.000Z',
  schemaVersion: SCHEMA_VERSION,
};

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

describe('session restore', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
  });

  it('restores a saved session with all predictions intact', () => {
    savePredictionSession(validSession);
    const restored = loadPredictionSession();
    expect(restored).toEqual(validSession);
    expect(restored!.predictions).toHaveLength(2);
  });

  it('restores card metadata including title, creator, and theme', () => {
    savePredictionSession(validSession);
    const restored = loadPredictionSession();
    expect(restored!.card.title).toBe('My Custom Title');
    expect(restored!.card.creatorName).toBe('Test User');
    expect(restored!.card.themeId).toBe('midnight');
  });

  it('returns null for unsupported schema version (migration gate)', () => {
    const futureSession = { ...validSession, schemaVersion: 'prediction-session:v99' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(futureSession));
    expect(loadPredictionSession()).toBeNull();
  });

  it('returns null after clearPredictionSession (reset)', () => {
    savePredictionSession(validSession);
    clearPredictionSession();
    expect(loadPredictionSession()).toBeNull();
  });
});

describe('card metadata editing persistence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
  });

  it('updates title while preserving other card fields', () => {
    savePredictionSession(validSession);
    updateStoredCardMetadata({ title: 'New Title' });
    const restored = loadPredictionSession();
    expect(restored!.card.title).toBe('New Title');
    expect(restored!.card.creatorName).toBe('Test User');
    expect(restored!.card.themeId).toBe('midnight');
  });

  it('updates themeId while preserving predictions', () => {
    savePredictionSession(validSession);
    updateStoredCardMetadata({ themeId: 'fiesta' });
    const restored = loadPredictionSession();
    expect(restored!.card.themeId).toBe('fiesta');
    expect(restored!.predictions).toHaveLength(2);
  });

  it('no-ops when no session exists', () => {
    updateStoredCardMetadata({ title: 'Orphan' });
    expect(loadPredictionSession()).toBeNull();
  });
});

describe('migration passthrough', () => {
  it('passes current version data through unchanged', () => {
    const result = migrateSession(validSession);
    expect(result).toEqual(validSession);
  });

  it('returns null for null input', () => {
    expect(migrateSession(null)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(migrateSession('string')).toBeNull();
  });
});
