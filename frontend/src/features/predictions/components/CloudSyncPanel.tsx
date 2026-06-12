import { useEffect, useState } from 'react';

export interface CloudSyncPanelProps {
  readonly compact?: boolean;
  readonly enabled: boolean;
  readonly loading: boolean;
  readonly username: string | null;
  readonly syncStatus: 'disabled' | 'idle' | 'loading' | 'syncing' | 'synced' | 'error';
  readonly syncMessage: string;
  readonly onSignUp: (username: string, password: string) => Promise<void>;
  readonly onSignIn: (username: string, password: string) => Promise<void>;
  readonly onSignOut: () => Promise<void>;
}

export function CloudSyncPanel({
  compact = false,
  enabled,
  loading,
  username,
  syncStatus,
  syncMessage,
  onSignUp,
  onSignIn,
  onSignOut,
}: CloudSyncPanelProps) {
  const [authUsername, setAuthUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (authMessage || syncStatus === 'error') {
      setExpanded(true);
    }
  }, [authMessage, syncStatus]);

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
            <strong className="cloud-sync-panel__headline">{username}</strong>
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
            <div className="cloud-sync-panel__actions">
              <button
                className="cloud-sync-panel__button cloud-sync-panel__button--secondary"
                type="button"
                disabled={submitting}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
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
            {loading ? 'Checking your account...' : 'Optional for backups.'}
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
