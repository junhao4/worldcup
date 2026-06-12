import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Tournament, MatchResult } from '../../types/tournament';
import type {
  LeaderboardEntry,
  MatchLockOverrideMode,
  MatchPrediction,
  PredictionSession,
  PredictionValidationResult,
  PredictionCard,
} from '../../types/prediction';
import type { AppUser } from '../../types/auth';
import { SCHEMA_VERSION, DEFAULT_CARD } from '../../types/prediction';
import { buildLeaderboardEntries, validatePredictionSession } from '../../engine';
import {
  savePredictionSession,
  loadPredictionSession,
  clearPredictionSession,
} from '../../persistence/predictionStorage';
import {
  choosePreferredSession,
  loadCloudPredictionSession,
  loadLeaderboardUsers,
  loadMatchLockOverrides,
  loadMatchTimeOverrides,
  loadOfficialResults,
  loadPublicPredictionSessions,
  saveCloudPredictionSession,
} from '../../persistence/predictionCloudStorage';
import { isSupabaseConfigured } from '../../lib/supabase';

const scheduleIdleWork: (cb: () => void, opts?: { timeout: number }) => ReturnType<typeof setTimeout> | number =
  typeof window !== 'undefined' && window.requestIdleCallback
    ? (cb, opts) => window.requestIdleCallback(cb, opts)
    : (cb) => setTimeout(cb, 1);

const REMOTE_REFRESH_INTERVAL_MS = 30_000;

export interface PredictionSessionState {
  session: PredictionSession;
  validation: PredictionValidationResult;
  predictedCount: number;
  totalMatches: number;
  cloudSyncStatus: 'disabled' | 'idle' | 'loading' | 'syncing' | 'synced' | 'error';
  cloudSyncMessage: string;
  leaderboardEntries: LeaderboardEntry[];
  leaderboardStatus: 'disabled' | 'loading' | 'ready' | 'error';
  leaderboardMessage: string;
  officialResults: Map<string, MatchResult>;
  matchLockOverrides: Map<string, MatchLockOverrideMode>;
  matchTimeOverrides: Map<string, string>;
  handleScoreChange: (matchId: string, homeScore: number, awayScore: number) => void;
  handleAdvancingTeamChange: (matchId: string, teamId: string) => void;
  handleCardChange: (updates: Partial<PredictionCard>) => void;
  handleReset: () => void;
}

export interface UsePredictionSessionOptions {
  readonly user: AppUser | null;
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

function mergeResultsIntoMatches(
  tournament: Tournament,
  officialResults: Map<string, MatchResult>,
) {
  return tournament.matches.map(match => ({
    ...match,
    result: officialResults.get(match.id) ?? match.result,
  }));
}

export function usePredictionSession(
  tournament: Tournament,
  { user }: UsePredictionSessionOptions,
): PredictionSessionState {
  const onlineEnabled = isSupabaseConfigured;
  const [session, setSession] = useState<PredictionSession>(() => {
    return loadPredictionSession() ?? createEmptySession(tournament);
  });
  const [cloudSyncStatus, setCloudSyncStatus] = useState<PredictionSessionState['cloudSyncStatus']>(
    onlineEnabled ? 'idle' : 'disabled',
  );
  const [cloudSyncMessage, setCloudSyncMessage] = useState(
    onlineEnabled
      ? 'Create an account or log in to save across devices.'
      : 'Online save is not available in this build.',
  );
  const [remoteReady, setRemoteReady] = useState(!onlineEnabled);
  const [officialResults, setOfficialResults] = useState<Map<string, MatchResult>>(new Map());
  const [matchLockOverrides, setMatchLockOverrides] = useState<Map<string, MatchLockOverrideMode>>(new Map());
  const [matchTimeOverrides, setMatchTimeOverrides] = useState<Map<string, string>>(new Map());
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardStatus, setLeaderboardStatus] = useState<PredictionSessionState['leaderboardStatus']>(
    onlineEnabled ? 'loading' : 'disabled',
  );
  const [leaderboardMessage, setLeaderboardMessage] = useState(
    onlineEnabled
      ? 'Loading leaderboard...'
      : 'Leaderboard is not available in this build.',
  );
  const lastSyncedUpdatedAtRef = useRef<string | null>(null);

  const mergedMatches = useMemo(
    () => mergeResultsIntoMatches(tournament, officialResults),
    [officialResults, tournament],
  );

  useEffect(() => {
    const id = scheduleIdleWork(() => savePredictionSession(session), { timeout: 1000 });
    return () => {
      if (typeof window !== 'undefined' && window.cancelIdleCallback) {
        window.cancelIdleCallback(id as number);
      }
    };
  }, [session]);

  useEffect(() => {
    if (!onlineEnabled) {
      setOfficialResults(new Map());
      setMatchLockOverrides(new Map());
      setMatchTimeOverrides(new Map());
      setLeaderboardStatus('disabled');
      setLeaderboardMessage('Leaderboard is not available in this build.');
      return;
    }

    let active = true;

    async function refreshOfficialResults() {
      try {
        const matchIds = tournament.matches.map(match => match.id);
        const [results, overrides, timeOverrides] = await Promise.all([
          loadOfficialResults(matchIds),
          loadMatchLockOverrides(matchIds),
          loadMatchTimeOverrides(matchIds),
        ]);
        if (!active) return;
        setOfficialResults(results);
        setMatchLockOverrides(overrides);
        setMatchTimeOverrides(timeOverrides);
      } catch {
        if (!active) return;
      }
    }

    refreshOfficialResults();
    const intervalId = window.setInterval(refreshOfficialResults, REMOTE_REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [onlineEnabled, tournament]);

  useEffect(() => {
    if (!onlineEnabled) {
      setRemoteReady(true);
      setCloudSyncStatus('disabled');
      setCloudSyncMessage('Online save is not available in this build.');
      return;
    }

    if (!user) {
      setRemoteReady(true);
      setCloudSyncStatus('idle');
      setCloudSyncMessage('Create an account or log in to save across devices.');
      lastSyncedUpdatedAtRef.current = null;
      return;
    }

    let active = true;

    setRemoteReady(false);
    setCloudSyncStatus('loading');
    setCloudSyncMessage('Loading your saved picks...');

    loadCloudPredictionSession(user, tournament.id)
      .then((remoteSession) => {
        if (!active) return;

        setSession(prev => {
          const preferred = choosePreferredSession(prev, remoteSession);
          lastSyncedUpdatedAtRef.current = remoteSession?.updatedAt ?? null;
          return preferred;
        });

        setCloudSyncStatus('synced');
        setCloudSyncMessage(remoteSession ? 'Your picks are saved.' : 'Your next change will create a saved draft.');
        setRemoteReady(true);
      })
      .catch(error => {
        if (!active) return;
        setRemoteReady(true);
        setCloudSyncStatus('error');
        setCloudSyncMessage(error instanceof Error ? error.message : 'Unable to load your saved picks.');
      });

    return () => {
      active = false;
    };
  }, [onlineEnabled, tournament.id, user]);

  useEffect(() => {
    if (!user || !onlineEnabled || !remoteReady) return;
    if (lastSyncedUpdatedAtRef.current === session.updatedAt) return;

    let active = true;
    setCloudSyncStatus('syncing');
    setCloudSyncMessage('Saving your latest changes...');

    const timeoutId = window.setTimeout(() => {
      saveCloudPredictionSession(user, session)
        .then(() => {
          if (!active) return;
          lastSyncedUpdatedAtRef.current = session.updatedAt;
          setCloudSyncStatus('synced');
          setCloudSyncMessage('Your picks are saved.');
        })
        .catch(error => {
          if (!active) return;
          setCloudSyncStatus('error');
          setCloudSyncMessage(error instanceof Error ? error.message : 'Unable to save your picks.');
        });
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [onlineEnabled, remoteReady, session, user]);

  useEffect(() => {
    if (!onlineEnabled) {
      setLeaderboardStatus('disabled');
      setLeaderboardEntries([]);
      setLeaderboardMessage('Leaderboard is not available in this build.');
      return;
    }

    let active = true;
    setLeaderboardStatus('loading');
    setLeaderboardMessage('Loading leaderboard...');

    async function refreshLeaderboard() {
      try {
        const leaderboardUsers = await loadLeaderboardUsers();
        const leaderboardUserIds = leaderboardUsers.map(entry => entry.userId);
        const publicSessions = await loadPublicPredictionSessions(tournament.id, leaderboardUserIds);
        if (!active) return;

        const entries = buildLeaderboardEntries(mergedMatches, publicSessions, leaderboardUsers, user?.id ?? null);
        setLeaderboardEntries(entries);
        setLeaderboardStatus('ready');
        setLeaderboardMessage(
          entries.length > 0
            ? 'Leaderboard updated.'
            : 'No leaderboard entries yet.',
        );
      } catch (error) {
        if (!active) return;
        setLeaderboardStatus('error');
        setLeaderboardMessage(error instanceof Error ? error.message : 'Unable to load the leaderboard.');
      }
    }

    refreshLeaderboard();
    const intervalId = window.setInterval(refreshLeaderboard, REMOTE_REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [mergedMatches, onlineEnabled, session.updatedAt, tournament.id, user?.id]);

  const validation = useMemo(
    () => validatePredictionSession(tournament, session.predictions),
    [tournament, session.predictions],
  );

  const predictedCount = session.predictions.length;
  const totalMatches = tournament.matches.length;

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

  const handleCardChange = useCallback((updates: Partial<PredictionCard>) => {
    setSession(prev => ({
      ...prev,
      card: { ...prev.card, ...updates },
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleReset = useCallback(() => {
    clearPredictionSession();
    const freshSession = createEmptySession(tournament);
    lastSyncedUpdatedAtRef.current = null;
    setSession(freshSession);
  }, [tournament]);

  return {
    session,
    validation,
    predictedCount,
    totalMatches,
    cloudSyncStatus,
    cloudSyncMessage,
    leaderboardEntries,
    leaderboardStatus,
    leaderboardMessage,
    officialResults,
    matchLockOverrides,
    matchTimeOverrides,
    handleScoreChange,
    handleAdvancingTeamChange,
    handleCardChange,
    handleReset,
  };
}
