import { describe, expect, it } from 'vitest';
import { getMatchLifecycleState, getPredictionLockTimestamp } from '../../../src/lib/matchTime';

describe('matchTime', () => {
  const kickoffAt = '2026-06-12T12:00:00.000Z';
  const kickoffTimestamp = new Date(kickoffAt).getTime();

  it('locks predictions fifteen minutes before kickoff', () => {
    expect(getPredictionLockTimestamp(kickoffAt)).toBe(kickoffTimestamp - 15 * 60 * 1000);
  });

  it('returns open before the lock window', () => {
    expect(getMatchLifecycleState(kickoffAt, false, 'default', kickoffTimestamp - (15 * 60 * 1000 + 1))).toBe('open');
  });

  it('returns locked during the fifteen minutes before kickoff', () => {
    expect(getMatchLifecycleState(kickoffAt, false, 'default', kickoffTimestamp - 10 * 60 * 1000)).toBe('locked');
  });

  it('returns in progress shortly after kickoff', () => {
    expect(getMatchLifecycleState(kickoffAt, false, 'default', kickoffTimestamp + 90 * 60 * 1000)).toBe('in_progress');
  });

  it('returns awaiting official result after the live window ends', () => {
    expect(getMatchLifecycleState(kickoffAt, false, 'default', kickoffTimestamp + 4 * 60 * 60 * 1000)).toBe('awaiting_official_result');
  });

  it('returns completed when an official result exists', () => {
    expect(getMatchLifecycleState(kickoffAt, true, 'default', kickoffTimestamp - 2 * 60 * 60 * 1000)).toBe('completed');
  });

  it('returns open when a match is force-opened', () => {
    expect(getMatchLifecycleState(kickoffAt, false, 'force_open', kickoffTimestamp + 4 * 60 * 60 * 1000)).toBe('open');
  });

  it('returns locked when a match is force-locked', () => {
    expect(getMatchLifecycleState(kickoffAt, false, 'force_locked', kickoffTimestamp - 2 * 60 * 60 * 1000)).toBe('locked');
  });
});
