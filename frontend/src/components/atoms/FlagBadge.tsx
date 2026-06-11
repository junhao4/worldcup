export interface FlagBadgeProps extends Readonly<{
  code: string;
  label?: string;
}> {}

export function FlagBadge({ code, label }: FlagBadgeProps) {
  return (
    <span aria-label={label ? `${label} flag` : undefined} className="flag">
      {code}
    </span>
  );
}
