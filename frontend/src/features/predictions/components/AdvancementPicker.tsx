export interface AdvancementPickerProps {
  readonly matchId: string;
  readonly homeTeamId: string;
  readonly awayTeamId: string;
  readonly homeLabel: string;
  readonly awayLabel: string;
  readonly selectedTeamId: string | null;
  readonly onSelect: (matchId: string, teamId: string) => void;
}

/** Standalone advancement picker for knockout ties (KB: 04h interaction in handler) */
export function AdvancementPicker({
  matchId,
  homeTeamId,
  awayTeamId,
  homeLabel,
  awayLabel,
  selectedTeamId,
  onSelect,
}: AdvancementPickerProps) {
  return (
    <div
      className="advancement-picker"
      role="group"
      aria-label="Select advancing team"
      data-testid={`advancement-picker-${matchId}`}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;

        const buttons = event.currentTarget.querySelectorAll('button');
        const current = Array.from(buttons).indexOf(event.target as HTMLButtonElement);
        const next =
          event.key === 'ArrowRight'
            ? (current + 1) % buttons.length
            : (current - 1 + buttons.length) % buttons.length;

        buttons[next]?.focus();
      }}
    >
      <p className="advancement-picker__prompt">Tie breaker</p>
      <button
        type="button"
        aria-pressed={selectedTeamId === homeTeamId}
        onClick={() => onSelect(matchId, homeTeamId)}
        className={`btn btn--sm btn--secondary ${selectedTeamId === homeTeamId ? 'advancement-picker__button--selected' : ''}`}
      >
        {homeLabel}
      </button>
      <button
        type="button"
        aria-pressed={selectedTeamId === awayTeamId}
        onClick={() => onSelect(matchId, awayTeamId)}
        className={`btn btn--sm btn--secondary ${selectedTeamId === awayTeamId ? 'advancement-picker__button--selected' : ''}`}
      >
        {awayLabel}
      </button>
    </div>
  );
}
