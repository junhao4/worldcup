import type { AppUser } from '../types/auth';

export const APP_USER_TABLE = 'app_users';
export const AUTH_SESSION_STORAGE_KEY = 'worldcup-auth-user';

export interface AppUserRow {
  id: string;
  username: string;
  password_hash: string;
  password_salt: string;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function textToBytes(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(username: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(username);
}

export function validatePassword(password: string): boolean {
  return password.length >= 4 && password.length <= 72;
}

export function generatePasswordSalt(): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const bytes = textToBytes(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return bytesToBase64Url(new Uint8Array(digest));
}

export function toAppUser(row: Pick<AppUserRow, 'id' | 'username'>): AppUser {
  return {
    id: row.id,
    username: row.username,
  };
}

export function loadStoredAppUser(): AppUser | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AppUser;
    if (!parsed?.id || !parsed?.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredAppUser(user: AppUser | null): void {
  if (typeof window === 'undefined') return;

  if (!user) {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
}
