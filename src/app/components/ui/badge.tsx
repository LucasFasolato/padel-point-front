import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  /** Badge variant */
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'neutral'
    | 'emerald';
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Badge content */
  children: ReactNode;
  /** Custom className */
  className?: string;
}

/**
 * Badge component for status indicators, tags, labels
 *
 * Features:
 * - 7 semantic variants
 * - 3 sizes
 * - Pill shape with ring
 *
 * @example
 * <Badge variant="success">Disponible</Badge>
 * <Badge variant="neutral" size="sm">Techada</Badge>
 */
export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
}: BadgeProps) {
  const variantStyles = {
    default:
      'bg-slate-100 text-slate-700 ring-slate-200/50',
    success:
      'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    warning:
      'bg-amber-50 text-amber-700 ring-amber-600/10',
    error:
      'bg-rose-50 text-rose-700 ring-rose-600/10',
    info:
      'bg-blue-50 text-blue-700 ring-blue-600/10',
    neutral:
      'bg-slate-50 text-slate-600 ring-slate-500/10',
    emerald:
      'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
