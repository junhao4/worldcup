import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends Readonly<HTMLAttributes<HTMLSpanElement>> {
  variant?: 'gold' | 'success';
}

export function Badge({ className, variant = 'success', ...props }: BadgeProps) {
  return <span className={cn('badge', `badge--${variant}`, className)} {...props} />;
}
