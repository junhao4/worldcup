import type { ExportImage } from '../../../types/prediction';
import type { ExportModel } from './buildExportModel';

export type ExportMode = 'group' | 'full';

/**
 * Generates a PNG data URL from the export model.
 * Synchronous — canvas operations don't need async.
 */
export function exportPredictionCard(model: ExportModel, mode: ExportMode = 'full'): ExportImage {
  const canvas = document.createElement('canvas');
  canvas.width = model.width;
  canvas.height = model.height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, model.width, model.height);

    // Green accent bar at top
    ctx.fillStyle = '#059669';
    ctx.fillRect(0, 0, model.width, 8);

    // Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(model.title, model.width / 2, 80);

    if (mode === 'full' && model.championName) {
      // Gold champion badge
      ctx.fillStyle = '#fbbf24';
      const badgeWidth = 300;
      const badgeX = (model.width - badgeWidth) / 2;
      ctx.fillRect(badgeX, 210, badgeWidth, 60);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`🏆 ${model.championName}`, model.width / 2, 248);
    }

    if (mode === 'group') {
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Group ${model.groupId}`, model.width / 2, 160);

      ctx.fillStyle = '#64748b';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText('Score Predictions', model.width / 2, 200);
    }

    // Creator
    if (model.creatorName) {
      ctx.fillStyle = '#64748b';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(`by ${model.creatorName}`, model.width / 2, model.height - 40);
    }

    // Footer branding
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('FIFA World Cup 2026 Predictor', model.width / 2, model.height - 16);
  }

  const dataUrl = canvas.toDataURL('image/png');

  return {
    status: 'ready',
    fileName: model.fileName,
    width: model.width,
    height: model.height,
    dataUrl,
  };
}
