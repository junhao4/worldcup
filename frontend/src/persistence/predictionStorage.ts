import { PredictionSessionSchema } from '../types/prediction';
import type { PredictionSession, PredictionCard } from '../types/prediction';
import { migrateSession } from './predictionMigrations';

export const STORAGE_KEY = 'prediction-session:v1';

/** Save a prediction session to localStorage (KB: 05d version & minimize, try-catch) */
export function savePredictionSession(session: PredictionSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Quota exceeded or private browsing — silently fail
  }
}

/** Load and validate a prediction session from localStorage (KB: 05d guarded parse) */
export function loadPredictionSession(): PredictionSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const migrated = migrateSession(parsed);
    if (!migrated) return null;

    const result = PredictionSessionSchema.safeParse(migrated);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Clear the stored prediction session */
export function clearPredictionSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/** Update only the card metadata on a stored session (KB: 05d minimize writes) */
export function updateStoredCardMetadata(card: Partial<PredictionCard>): void {
  const session = loadPredictionSession();
  if (!session) return;
  savePredictionSession({
    ...session,
    card: { ...session.card, ...card },
    updatedAt: new Date().toISOString(),
  });
}
