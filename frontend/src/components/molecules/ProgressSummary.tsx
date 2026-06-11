import { Progress } from '../ui/progress';

export interface ProgressSummaryProps extends Readonly<{
  label: string;
  value: number;
}> {}

export function ProgressSummary({ label, value }: ProgressSummaryProps) {
  return (
    <div className="progress-summary">
      <div className="progress-summary__label">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <Progress value={value} />
    </div>
  );
}
