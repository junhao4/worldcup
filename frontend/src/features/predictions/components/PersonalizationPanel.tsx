import { useState } from 'react';
import type { PredictionCard } from '../../../types/prediction';
import { predictionThemes } from '../../../data/predictionThemes';

export interface PersonalizationPanelProps {
  readonly card: PredictionCard;
  readonly onCardChange: (card: Partial<PredictionCard>) => void;
}

/** Personalization controls for card title, creator name, and theme (KB: 04h — interaction in handlers, 04k — functional updates at parent) */
export function PersonalizationPanel({ card, onCardChange }: PersonalizationPanelProps) {
  const [title, setTitle] = useState(card.title);
  const [creatorName, setCreatorName] = useState(card.creatorName ?? '');

  return (
    <div className="personalization-panel" data-testid="personalization-panel">
      <h3 className="personalization-panel__heading">Customize Your Card</h3>

      <label className="personalization-panel__field">
        Card title
        <input
          type="text"
          value={title}
          maxLength={80}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => onCardChange({ title })}
        />
      </label>

      <label className="personalization-panel__field">
        Export credit
        <input
          type="text"
          value={creatorName}
          maxLength={40}
          onChange={e => setCreatorName(e.target.value)}
          onBlur={() => onCardChange({ creatorName: creatorName || null })}
        />
      </label>

      <fieldset className="personalization-panel__themes">
        <legend>Theme</legend>
        <div className="personalization-panel__swatches">
          {predictionThemes.map(theme => (
            <button
              key={theme.id}
              type="button"
              className="swatch"
              aria-label={`Use ${theme.name} theme`}
              aria-pressed={card.themeId === theme.id}
              style={{ backgroundColor: theme.primaryColor }}
              onClick={() => onCardChange({ themeId: theme.id })}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
