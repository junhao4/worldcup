import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends Readonly<HTMLAttributes<HTMLDivElement>> {
  value: number;
}

export function Progress({ className, value, ...props }: ProgressProps) {
  return (
    <div aria-valuemax={100} aria-valuemin={0} aria-valuenow={value} className={cn('progress', className)} role="progressbar" {...props}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
