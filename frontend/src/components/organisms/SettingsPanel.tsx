import type { PredictionCard } from '../../types/prediction';
import { predictionThemes } from '../../data/predictionThemes';
import { ThemeSwatch } from '../atoms/ThemeSwatch';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

export interface SettingsPanelProps {
  readonly card: PredictionCard;
  readonly onCardChange: (updates: Partial<PredictionCard>) => void;
}

/** Settings panel bound to session card metadata (KB: 04h — interaction in event handlers) */
export function SettingsPanel({ card, onCardChange }: SettingsPanelProps) {
  return (
    <Card variant="settings">
      <div className="settings-panel__header">
        <p className="eyebrow">Image export</p>
        <h2>{card.title}</h2>
      </div>
      <label className="settings-panel__group">
        Card title
        <Input
          defaultValue={card.title}
          onBlur={e => onCardChange({ title: e.target.value || card.title })}
        />
      </label>
      <label className="settings-panel__group">
        Display name
        <Input
          defaultValue={card.creatorName ?? ''}
          onBlur={e => onCardChange({ creatorName: e.target.value || null })}
        />
      </label>
      <div className="settings-panel__group">
        Theme
        <div className="swatches">
          {predictionThemes.map(theme => (
            <ThemeSwatch
              key={theme.id}
              themeId={theme.id}
              themeName={theme.name}
              color={theme.primaryColor}
              isSelected={theme.id === card.themeId}
              onSelect={id => onCardChange({ themeId: id })}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
