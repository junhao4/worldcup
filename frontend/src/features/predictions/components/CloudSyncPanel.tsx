import { useEffect, useState } from 'react';
import type { UserProfile } from '../../../types/prediction';

export interface CloudSyncPanelProps {
  readonly compact?: boolean;
  readonly enabled: boolean;
  readonly loading: boolean;
  readonly username: string | null;
  readonly syncStatus: 'disabled' | 'idle' | 'loading' | 'syncing' | 'synced' | 'error';
  readonly syncMessage: string;
  readonly profile: UserProfile | null;
  readonly profileStatus: 'idle' | 'saving' | 'saved' | 'error';
  readonly profileMessage: string;
  readonly onSignUp: (username: string, password: string) => Promise<void>;
  readonly onSignIn: (username: string, password: string) => Promise<void>;
  readonly onSignOut: () => Promise<void>;
  readonly onSaveProfile: (updates: Pick<UserProfile, 'displayName' | 'isPublic'>) => Promise<void>;
}

export function CloudSyncPanel({
  compact = false,
  enabled,
  loading,
  username,
  syncStatus,
  syncMessage,
  profile,
  profileStatus,
  profileMessage,
  onSignUp,
  onSignIn,
  onSignOut,
  onSaveProfile,
}: CloudSyncPanelProps) {
  const [authUsername, setAuthUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [isPublic, setIsPublic] = useState(profile?.isPublic ?? false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '');
    setIsPublic(profile?.isPublic ?? false);
  }, [profile?.displayName, profile?.isPublic]);

  useEffect(() => {
    if (authMessage || profileStatus === 'saving' || syncStatus === 'error' || profileStatus === 'error') {
      setExpanded(true);
    }
  }, [authMessage, profileStatus, syncStatus]);

  async function handleAuth(mode: 'signup' | 'signin') {
    if (!authUsername.trim() || !password) return;

    setSubmitting(true);
    setAuthMessage(null);

    try {
      if (mode === 'signup') {
        await onSignUp(authUsername, password);
        setAuthMessage('Account created. You are now signed in.');
      } else {
        await onSignIn(authUsername, password);
        setAuthMessage('Signed in successfully.');
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Unable to continue.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    setSubmitting(true);
    setAuthMessage(null);

    try {
      await onSignOut();
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Unable to sign out.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProfileSave() {
    if (!displayName.trim()) {
      setAuthMessage('Add a display name before joining the leaderboard.');
      return;
    }

    setSubmitting(true);
    setAuthMessage(null);

    try {
      await onSaveProfile({ displayName: displayName.trim(), isPublic });
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Unable to save your profile.');
    } finally {
      setSubmitting(false);
    }
  }

  const rootClassName = `cloud-sync-panel${compact ? ' cloud-sync-panel--compact' : ''}`;

  if (!enabled) {
    return (
      <aside className={rootClassName} data-testid="cloud-sync-panel">
        <div className="cloud-sync-panel__summary">
          <div className="cloud-sync-panel__summary-copy">
            <p className="cloud-sync-panel__label">Account</p>
            <strong className="cloud-sync-panel__headline">This device only</strong>
            <p className="cloud-sync-panel__message">Online save is unavailable in this build.</p>
          </div>
        </div>
      </aside>
    );
  }

  if (username) {
    return (
      <aside className={rootClassName} data-testid="cloud-sync-panel">
        <div className="cloud-sync-panel__summary">
          <div className="cloud-sync-panel__summary-copy">
            <p className="cloud-sync-panel__label">Account</p>
            <strong className="cloud-sync-panel__headline">{displayName || username}</strong>
            <p className={`cloud-sync-panel__message cloud-sync-panel__message--${syncStatus}`}>
              {loading ? 'Checking your account...' : syncMessage}
            </p>
          </div>

          <button
            className="cloud-sync-panel__toggle"
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide' : 'Manage'}
          </button>
        </div>

        {expanded ? (
          <>
            <div className="cloud-sync-panel__fields">
              <label className="cloud-sync-panel__field">
                <span>Display name</span>
                <input
                  className="cloud-sync-panel__input"
                  type="text"
                  maxLength={40}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  disabled={submitting}
                />
              </label>

              <label className="cloud-sync-panel__checkbox">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.target.checked)}
                  disabled={submitting}
                />
                <span>Show me on the public leaderboard</span>
              </label>
            </div>

            <div className="cloud-sync-panel__actions">
              <button
                className="cloud-sync-panel__button"
                type="button"
                disabled={submitting || profileStatus === 'saving'}
                onClick={handleProfileSave}
              >
                {profileStatus === 'saving' ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                className="cloud-sync-panel__button cloud-sync-panel__button--secondary"
                type="button"
                disabled={submitting}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
            <p className={`cloud-sync-panel__message cloud-sync-panel__message--${profileStatus}`}>
              {profileMessage}
            </p>
            {authMessage ? <p className="cloud-sync-panel__feedback">{authMessage}</p> : null}
          </>
        ) : null}
      </aside>
    );
  }

  return (
    <aside className={rootClassName} data-testid="cloud-sync-panel">
      <div className="cloud-sync-panel__summary">
        <div className="cloud-sync-panel__summary-copy">
          <p className="cloud-sync-panel__label">Account</p>
          <strong className="cloud-sync-panel__headline">Save across devices</strong>
          <p className={`cloud-sync-panel__message cloud-sync-panel__message--${syncStatus}`}>
            {loading ? 'Checking your account...' : 'Optional for backups and leaderboard.'}
          </p>
        </div>

        <button
          className="cloud-sync-panel__toggle"
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          {expanded ? 'Hide' : 'Sign in'}
        </button>
      </div>

      {expanded ? (
        <>
          <form
            className="cloud-sync-panel__form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleAuth('signin');
            }}
          >
            <input
              className="cloud-sync-panel__input"
              type="text"
              placeholder="username"
              value={authUsername}
              onChange={(event) => setAuthUsername(event.target.value)}
              disabled={submitting}
            />
            <input
              className="cloud-sync-panel__input"
              type="password"
              placeholder="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
            />
            <div className="cloud-sync-panel__actions">
              <button
                className="cloud-sync-panel__button"
                type="button"
                disabled={submitting || !authUsername.trim() || !password}
                onClick={() => void handleAuth('signup')}
              >
                {submitting ? 'Working...' : 'Create Account'}
              </button>
              <button
                className="cloud-sync-panel__button cloud-sync-panel__button--secondary"
                type="submit"
                disabled={submitting || !authUsername.trim() || !password}
              >
                {submitting ? 'Working...' : 'Log In'}
              </button>
            </div>
          </form>
          <p className="cloud-sync-panel__message">Unique usernames only. Usernames use letters, numbers, and underscores.</p>
          {authMessage ? <p className="cloud-sync-panel__feedback">{authMessage}</p> : null}
        </>
      ) : null}
    </aside>
  );
}
