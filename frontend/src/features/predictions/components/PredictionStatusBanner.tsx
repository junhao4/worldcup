import type { PredictionValidationResult } from '../../../types/prediction';

export interface PredictionStatusBannerProps {
  readonly validation: PredictionValidationResult;
  readonly predictedCount: number;
  readonly totalMatches: number;
}

/** Feedback banner for missing selections, downstream resets, and invalid ties */
export function PredictionStatusBanner({ validation, predictedCount, totalMatches }: PredictionStatusBannerProps) {
  const { complete, missingMatchIds, resetMatchIds, messages } = validation;

  if (complete) {
    return (
      <div className="prediction-status-banner prediction-status-banner--complete" role="status" data-testid="status-banner">
        <p>🏆 All {totalMatches} predictions complete!</p>
      </div>
    );
  }

  return (
    <div className="prediction-status-banner prediction-status-banner--incomplete" role="status" data-testid="status-banner">
      <p className="prediction-status-banner__progress">
        {predictedCount}/{totalMatches} matches predicted
      </p>
      {missingMatchIds.length > 0 && (
        <p className="prediction-status-banner__missing">
          {missingMatchIds.length} match{missingMatchIds.length > 1 ? 'es' : ''} still need scores
        </p>
      )}
      {resetMatchIds.length > 0 && (
        <p className="prediction-status-banner__reset">
          {resetMatchIds.length} downstream prediction{resetMatchIds.length > 1 ? 's' : ''} reset — please re-enter
        </p>
      )}
      {messages.length > 0 && (
        <ul className="prediction-status-banner__errors" aria-label="Validation errors">
          {messages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
