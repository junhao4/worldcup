import { SCHEMA_VERSION } from '../types/prediction';
import type { PredictionSession } from '../types/prediction';

const SUPPORTED_VERSIONS: ReadonlySet<string> = new Set([SCHEMA_VERSION]);

/** Migrate a stored session to the current schema version. Returns null if unrecognised. */
export function migrateSession(data: unknown): PredictionSession | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const version = record.schemaVersion;

  if (typeof version !== 'string' || !SUPPORTED_VERSIONS.has(version)) {
    return null;
  }

  // Current version — pass through
  return data as PredictionSession;
}
