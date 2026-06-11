import { useState } from 'react';
import type { ExportModel } from '../export/buildExportModel';
import { exportPredictionCard } from '../export/exportPredictionCard';

export interface ExportActionsProps {
  readonly exportModel: ExportModel | null;
  readonly isExportable: boolean;
}

export function ExportActions({ exportModel, isExportable }: ExportActionsProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDownload = () => {
    if (!exportModel) return;
    try {
      const result = exportPredictionCard(exportModel, 'full');
      if (result.dataUrl) {
        const link = document.createElement('a');
        link.href = result.dataUrl;
        link.download = result.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus('success');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="export-actions" data-testid="export-actions">
      <button
        className="btn btn--primary"
        disabled={!isExportable}
        onClick={handleDownload}
        aria-label="Download PNG"
        type="button"
      >
        Download PNG
      </button>
      {!isExportable ? (
        <p className="export-actions__hint">Complete all match predictions to export the full tournament card.</p>
      ) : null}
      {status === 'success' ? (
        <p className="export-actions__feedback" role="status">✓ Downloaded!</p>
      ) : null}
      {status === 'error' ? (
        <p className="export-actions__feedback export-actions__feedback--error" role="alert">
          Export failed. Please try again.
        </p>
      ) : null}
    </div>
  );
}
