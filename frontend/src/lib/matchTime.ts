const SINGAPORE_TIME_ZONE = 'Asia/Singapore';

const singaporeFormatter = new Intl.DateTimeFormat('en-SG', {
  day: 'numeric',
  hour: 'numeric',
  hour12: true,
  minute: '2-digit',
  month: 'short',
  timeZone: SINGAPORE_TIME_ZONE,
});

const singaporeDateFormatter = new Intl.DateTimeFormat('en-SG', {
  day: 'numeric',
  month: 'long',
  timeZone: SINGAPORE_TIME_ZONE,
  weekday: 'long',
});

export function formatSingaporeKickoff(kickoffAt: string | undefined): string | null {
  if (!kickoffAt) return null;
  const date = new Date(kickoffAt);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = singaporeFormatter.format(date).replace(/\b(am|pm)\b/g, value => value.toUpperCase());
  return `${formatted} SGT`;
}

export function formatSingaporeDateLabel(kickoffAt: string | undefined): string | null {
  if (!kickoffAt) return null;
  const date = new Date(kickoffAt);
  if (Number.isNaN(date.getTime())) return null;
  return singaporeDateFormatter.format(date);
}
