import type { ExportModel } from '../../features/predictions/export/buildExportModel';
import { predictionThemes } from '../../data/predictionThemes';
import { Card } from '../ui/card';

export interface ExportPreviewCardProps {
  readonly model: ExportModel | null;
}

/** Renders export preview card bound to real export model with personalized theme (KB: 06i — explicit conditional rendering) */
export function ExportPreviewCard({ model }: ExportPreviewCardProps) {
  if (!model) {
    return (
      <Card variant="preview">
        <p className="preview-card__empty">Complete your prediction to unlock the export preview.</p>
      </Card>
    );
  }

  const theme = predictionThemes.find(t => t.id === model.themeId);
  const bgColor = theme?.backgroundColor ?? '#ffffff';
  const textColor = theme?.textColor ?? '#1a202c';

  return (
    <Card variant="preview">
      <section className="preview-card__hero" style={{ backgroundColor: bgColor, color: textColor }}>
        <p className="eyebrow">Export preview</p>
        <h2>{model.title}</h2>
        <div className="preview-card__champion">
          <span>Champion</span>
          <strong>{model.championName}</strong>
        </div>
      </section>
      <footer className="preview-card__footer" style={{ backgroundColor: bgColor, color: textColor }}>
        {model.creatorName ? <span>Created by {model.creatorName}</span> : null}
      </footer>
    </Card>
  );
}
