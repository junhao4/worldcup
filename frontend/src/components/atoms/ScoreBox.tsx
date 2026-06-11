export interface ScoreBoxProps extends Readonly<{
  label: string;
  score: number;
}> {}

export function ScoreBox({ label, score }: ScoreBoxProps) {
  return (
    <span aria-label={`${label} score ${score}`} className="score-box">
      {score}
    </span>
  );
}
