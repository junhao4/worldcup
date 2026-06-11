import type { Tournament } from '../../../types/tournament';
import type { PredictionSession, PredictionValidationResult } from '../../../types/prediction';

export interface ExportModel {
  title: string;
  creatorName: string | null;
  themeId: string;
  championName: string;
  championFifaCode: string;
  fileName: string;
  width: number;
  height: number;
  groupId?: string;
}

/** Builds export model. When groupId is provided, produces a group-only card without requiring full completion. */
export function buildExportModel(
  tournament: Tournament,
  session: PredictionSession,
  validation: PredictionValidationResult,
  groupId?: string,
): ExportModel | null {
  if (groupId) {
    const group = tournament.groups.find(g => g.id === groupId);
    if (!group) return null;
    const slug = tournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    return {
      title: `${session.card.title} — ${group.name}`,
      creatorName: session.card.creatorName,
      themeId: session.card.themeId,
      championName: '',
      championFifaCode: '',
      fileName: `${slug}-${group.name.toLowerCase().replace(/\s+/g, '-')}.png`,
      width: 800,
      height: 600,
      groupId,
    };
  }

  if (!validation.complete || !validation.valid) return null;

  const championId = validation.championTeamId ?? session.card.championTeamId;
  if (!championId) return null;

  const champion = tournament.teams.find(t => t.id === championId);
  if (!champion) return null;

  const slug = tournament.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return {
    title: session.card.title,
    creatorName: session.card.creatorName,
    themeId: session.card.themeId,
    championName: champion.name,
    championFifaCode: champion.fifaCode,
    fileName: `${slug}-prediction.png`,
    width: 1200,
    height: 630,
  };
}
