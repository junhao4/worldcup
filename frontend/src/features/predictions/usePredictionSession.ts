import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Tournament } from '../../types/tournament';
import type { MatchPrediction, PredictionSession, PredictionValidationResult, PredictionCard } from '../../types/prediction';
import { SCHEMA_VERSION, DEFAULT_CARD } from '../../types/prediction';
import { validatePredictionSession } from '../../engine';
import { savePredictionSession, loadPredictionSession, clearPredictionSession } from '../../persistence/predictionStorage';

// KB: 05f — fallback for requestIdleCallback
const scheduleIdleWork: (cb: () => void, opts?: { timeout: number }) => ReturnType<typeof setTimeout> | number =
  typeof window !== 'undefined' && window.requestIdleCallback
    ? (cb, opts) => window.requestIdleCallback(cb, opts)
    : (cb) => setTimeout(cb, 1);

export interface PredictionSessionState {
  session: PredictionSession;
  validation: PredictionValidationResult;
  predictedCount: number;
  totalMatches: number;
  handleScoreChange: (matchId: string, homeScore: number, awayScore: number) => void;
  handleAdvancingTeamChange: (matchId: string, teamId: string) => void;
  handleCardChange: (updates: Partial<PredictionCard>) => void;
  handleReset: () => void;
}

function createEmptySession(tournament: Tournament): PredictionSession {
  return {
    id: crypto.randomUUID(),
    tournamentId: tournament.id,
    predictions: [],
    card: { ...DEFAULT_CARD },
    updatedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
  };
}

/** Session state orchestrator — lazy init from localStorage (KB: 04l), functional setState (KB: 04k), derived during render (KB: 04a) */
export function usePredictionSession(tournament: Tournament): PredictionSessionState {
  // KB: 04l — lazy state initialization from localStorage
  const [session, setSession] = useState<PredictionSession>(() => {
    return loadPredictionSession() ?? createEmptySession(tournament);
  });

  // KB: 05f — defer non-critical localStorage save to idle time
  useEffect(() => {
    const id = scheduleIdleWork(() => savePredictionSession(session), { timeout: 1000 });
    return () => {
      if (typeof window !== 'undefined' && window.cancelIdleCallback) {
        window.cancelIdleCallback(id as number);
      }
    };
  }, [session]);

  // KB: 04a — derive validation during render
  const validation = useMemo(
    () => validatePredictionSession(tournament, session.predictions),
    [tournament, session.predictions],
  );

  const predictedCount = session.predictions.length;
  const totalMatches = tournament.matches.length;

  // KB: 04h — interaction logic in event handlers, 04k — functional setState
  const handleScoreChange = useCallback((matchId: string, homeScore: number, awayScore: number) => {
    setSession(prev => {
      const existing = prev.predictions.find(p => p.matchId === matchId);
      const prediction: MatchPrediction = {
        matchId,
        homeScore,
        awayScore,
        advancingTeamId: existing?.advancingTeamId ?? null,
      };
      const predictions = existing
        ? prev.predictions.map(p => p.matchId === matchId ? prediction : p)
        : [...prev.predictions, prediction];
      return { ...prev, predictions, updatedAt: new Date().toISOString() };
    });
  }, []);

  const handleAdvancingTeamChange = useCallback((matchId: string, teamId: string) => {
    setSession(prev => {
      const predictions = prev.predictions.map(p =>
        p.matchId === matchId ? { ...p, advancingTeamId: teamId } : p,
      );
      return { ...prev, predictions, updatedAt: new Date().toISOString() };
    });
  }, []);

  // KB: 04k — functional setState for card metadata update
  const handleCardChange = useCallback((updates: Partial<PredictionCard>) => {
    setSession(prev => ({
      ...prev,
      card: { ...prev.card, ...updates },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // KB: 04h — reset triggered by user action in handler
  const handleReset = useCallback(() => {
    clearPredictionSession();
    setSession(createEmptySession(tournament));
  }, [tournament]);

  return {
    session, validation, predictedCount, totalMatches,
    handleScoreChange, handleAdvancingTeamChange, handleCardChange, handleReset,
  };
}
