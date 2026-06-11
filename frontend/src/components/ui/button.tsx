import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends Readonly<ButtonHTMLAttributes<HTMLButtonElement>> {
  size?: 'md' | 'sm';
  variant?: 'gold' | 'outline' | 'primary' | 'secondary';
}

export function Button({ className, size = 'md', variant = 'primary', ...props }: ButtonProps) {
  return <button className={cn('btn', `btn--${variant}`, `btn--${size}`, className)} {...props} />;
}
