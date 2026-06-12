import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  APP_USER_TABLE,
  generatePasswordSalt,
  hashPassword,
  loadStoredAppUser,
  normalizeUsername,
  saveStoredAppUser,
  toAppUser,
  validatePassword,
  validateUsername,
  type AppUserRow,
} from '../lib/simpleAuth';
import type { AppUser } from '../types/auth';

export interface AppAuthState {
  readonly enabled: boolean;
  readonly loading: boolean;
  readonly user: AppUser | null;
  readonly signUp: (username: string, password: string) => Promise<void>;
  readonly signIn: (username: string, password: string) => Promise<void>;
  readonly signOut: () => Promise<void>;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === 'string' ? record.message : null;
    const details = typeof record.details === 'string' ? record.details : null;
    const hint = typeof record.hint === 'string' ? record.hint : null;
    const code = typeof record.code === 'string' ? record.code : null;

    return [message, details, hint, code ? `code: ${code}` : null]
      .filter((part): part is string => Boolean(part))
      .join(' | ') || fallback;
  }

  return fallback;
}

export function useAppAuth(): AppAuthState {
  const enabled = isSupabaseConfigured;
  const [loading, setLoading] = useState(enabled);
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setUser(loadStoredAppUser());
    setLoading(false);
  }, [enabled]);

  const signUp = useCallback(async (username: string, password: string) => {
    if (!enabled || !supabase) {
      throw new Error('Online account features are not available in this build.');
    }

    const normalizedUsername = normalizeUsername(username);
    if (!validateUsername(normalizedUsername)) {
      throw new Error('Username must be 3-24 characters using only letters, numbers, and underscores.');
    }
    if (!validatePassword(password)) {
      throw new Error('Password must be between 4 and 72 characters.');
    }

    const { data: existingUser, error: existingUserError } = await supabase
      .from(APP_USER_TABLE)
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (existingUserError) {
      throw new Error(toErrorMessage(existingUserError, 'Unable to check that username.'));
    }
    if (existingUser) {
      throw new Error('That username is already taken.');
    }

    const passwordSalt = generatePasswordSalt();
    const passwordHash = await hashPassword(password, passwordSalt);

    const { data, error } = await supabase
      .from(APP_USER_TABLE)
      .insert({
        username: normalizedUsername,
        password_hash: passwordHash,
        password_salt: passwordSalt,
      })
      .select('id,username,password_hash,password_salt')
      .single();

    if (error) {
      throw new Error(toErrorMessage(error, 'Unable to create account.'));
    }

    const nextUser = toAppUser(data as AppUserRow);
    saveStoredAppUser(nextUser);
    setUser(nextUser);
  }, [enabled]);

  const signIn = useCallback(async (username: string, password: string) => {
    if (!enabled || !supabase) {
      throw new Error('Online account features are not available in this build.');
    }

    const normalizedUsername = normalizeUsername(username);
    const { data, error } = await supabase
      .from(APP_USER_TABLE)
      .select('id,username,password_hash,password_salt')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (error) {
      throw new Error(toErrorMessage(error, 'Unable to look up that account.'));
    }
    if (!data) {
      throw new Error('Incorrect username or password.');
    }

    const userRow = data as AppUserRow;
    const candidateHash = await hashPassword(password, userRow.password_salt);
    if (candidateHash !== userRow.password_hash) {
      throw new Error('Incorrect username or password.');
    }

    const nextUser = toAppUser(userRow);
    saveStoredAppUser(nextUser);
    setUser(nextUser);
  }, [enabled]);

  const signOut = useCallback(async () => {
    saveStoredAppUser(null);
    setUser(null);
  }, []);

  return {
    enabled,
    loading,
    user,
    signUp,
    signIn,
    signOut,
  };
}
