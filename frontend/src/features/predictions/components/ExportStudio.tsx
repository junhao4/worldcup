import { useMemo } from 'react';
import type { Tournament } from '../../../types/tournament';
import type { PredictionSession, PredictionValidationResult } from '../../../types/prediction';
import { buildExportModel } from '../export/buildExportModel';
import { ExportActions } from './ExportActions';

export interface ExportStudioProps {
  readonly tournament: Tournament;
  readonly session: PredictionSession;
  readonly validation: PredictionValidationResult;
}

/** Export studio — derives export model during render (KB: 04a), delegates action states to ExportActions */
export function ExportStudio({ tournament, session, validation }: ExportStudioProps) {
  // KB: 04a — derive export model during render instead of storing in state
  const exportModel = useMemo(
    () => buildExportModel(tournament, session, validation),
    [tournament, session, validation],
  );

  // KB: 04c — simple boolean derived without useMemo
  const isExportable = validation.complete && validation.valid;

  const championTeam = validation.championTeamId
    ? tournament.teams.find(t => t.id === validation.championTeamId)
    : null;

  return (
    <div className="export-studio" data-testid="export-studio">
      <div className="export-studio__preview">
        <p className="export-studio__eyebrow">Export Preview</p>
        <h2 className="export-studio__title">{session.card.title}</h2>
        {championTeam ? (
          <p className="export-studio__champion">Champion: {championTeam.name}</p>
        ) : null}
      </div>
      <ExportActions exportModel={exportModel} isExportable={isExportable} />
    </div>
  );
}
