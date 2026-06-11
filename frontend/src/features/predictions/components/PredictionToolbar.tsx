export interface PredictionToolbarProps {
  readonly predictedCount: number;
  readonly totalMatches: number;
  readonly onReset: () => void;
}

/** Toolbar showing progress and reset action (KB: 04a — derived progress during render) */
export function PredictionToolbar({ predictedCount, totalMatches, onReset }: PredictionToolbarProps) {
  const progress = totalMatches > 0 ? Math.round((predictedCount / totalMatches) * 100) : 0;

  return (
    <div className="prediction-toolbar" data-testid="prediction-toolbar">
      <span className="prediction-toolbar__progress">
        {predictedCount}/{totalMatches} matches ({progress}%)
      </span>
      <button
        type="button"
        className="prediction-toolbar__reset"
        onClick={onReset}
        disabled={predictedCount === 0}
      >
        Reset All
      </button>
    </div>
  );
}
