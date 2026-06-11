import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends Readonly<InputHTMLAttributes<HTMLInputElement>> {}

export function Input({ className, ...props }: InputProps) {
  return <input className={cn('input', className)} {...props} />;
}
