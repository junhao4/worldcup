import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends Readonly<HTMLAttributes<HTMLDivElement>> {
  variant?: 'bracket' | 'panel' | 'preview' | 'score' | 'settings';
}

export interface CardSectionProps extends Readonly<HTMLAttributes<HTMLDivElement>> {}

export function Card({ className, variant = 'panel', ...props }: CardProps) {
  return <div className={cn(variantClassName[variant], className)} {...props} />;
}

export function CardHeader({ className, ...props }: CardSectionProps) {
  return <div className={cn('panel__header', className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardSectionProps) {
  return <div className={cn('panel__title', className)} {...props} />;
}

export function CardContent({ className, ...props }: CardSectionProps) {
  return <div className={cn('panel__content', className)} {...props} />;
}

const variantClassName: Record<NonNullable<CardProps['variant']>, string> = {
  bracket: 'bracket-card',
  panel: 'panel',
  preview: 'preview-card',
  score: 'score-card',
  settings: 'settings-panel',
};
