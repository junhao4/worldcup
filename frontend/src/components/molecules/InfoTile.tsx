import { Card } from '../ui/card';

export interface InfoTileProps {
  readonly label: string;
  readonly value: string;
  readonly variant?: 'default' | 'success' | 'error' | 'loading';
}

/** Simple info tile showing a label/value pair with optional status variant */
export function InfoTile({ label, value, variant = 'default' }: InfoTileProps) {
  return (
    <Card className={`info-tile info-tile--${variant}`} variant="panel">
      <span className="info-tile__label">{label}</span>
      <strong className="info-tile__value">{value}</strong>
    </Card>
  );
}
