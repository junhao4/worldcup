/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  savePredictionSession,
  loadPredictionSession,
  clearPredictionSession,
  STORAGE_KEY,
} from '../../../src/persistence/predictionStorage';
import { migrateSession } from '../../../src/persistence/predictionMigrations';
import { choosePreferredSession } from '../../../src/persistence/predictionCloudStorage';
import type { PredictionSession } from '../../../src/types/prediction';
import { SCHEMA_VERSION } from '../../../src/types/prediction';

const validSession: PredictionSession = {
  id: 'test-session-1',
  tournamentId: 'world-cup-2026',
  predictions: [
    { matchId: 'g-A-1', homeScore: 2, awayScore: 1, advancingTeamId: null },
  ],
  card: {
    title: 'My Predictions',
    creatorName: null,
    themeId: 'classic',
    championTeamId: null,
  },
  updatedAt: '2026-06-10T00:00:00.000Z',
  schemaVersion: SCHEMA_VERSION,
};

// Create a simple in-memory localStorage mock
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

describe('predictionStorage', () => {
  beforeEach(() => {
    const mock = createLocalStorageMock();
    vi.stubGlobal('localStorage', mock);
  });

  it('saves and loads a valid session', () => {
    savePredictionSession(validSession);
    const loaded = loadPredictionSession();
    expect(loaded).toEqual(validSession);
  });

  it('returns null when nothing is stored', () => {
    const loaded = loadPredictionSession();
    expect(loaded).toBeNull();
  });

  it('returns null for corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');
    const loaded = loadPredictionSession();
    expect(loaded).toBeNull();
  });

  it('returns null for invalid schema data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: 123 }));
    const loaded = loadPredictionSession();
    expect(loaded).toBeNull();
  });

  it('clears a stored session', () => {
    savePredictionSession(validSession);
    clearPredictionSession();
    expect(loadPredictionSession()).toBeNull();
  });
});

describe('predictionMigrations', () => {
  it('passes through a current-version session unchanged', () => {
    const result = migrateSession(validSession);
    expect(result).toEqual(validSession);
  });

  it('returns null for an unrecognised schema version', () => {
    const unknown = { ...validSession, schemaVersion: 'prediction-session:v99' };
    const result = migrateSession(unknown as unknown as PredictionSession);
    expect(result).toBeNull();
  });
});

describe('choosePreferredSession', () => {
  it('prefers the newer remote session when timestamps differ', () => {
    const remoteSession: PredictionSession = {
      ...validSession,
      updatedAt: '2026-06-11T00:00:00.000Z',
      card: { ...validSession.card, title: 'Remote Wins' },
    };

    expect(choosePreferredSession(validSession, remoteSession)).toEqual(remoteSession);
  });

  it('keeps the local session when remote is missing', () => {
    expect(choosePreferredSession(validSession, null)).toEqual(validSession);
  });
});
