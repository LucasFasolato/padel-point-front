import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps {
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'primary' | 'white' | 'slate';
  /** Custom className */
  className?: string;
}

/**
 * Spinner component for loading states
 *
 * @example
 * <Spinner size="md" variant="primary" />
 */
export function Spinner({
  size = 'md',
  variant = 'primary',
  className,
}: SpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const variantStyles = {
    primary: 'text-emerald-600',
    white: 'text-white',
    slate: 'text-slate-400',
  };

  return (
    <Loader2
      size={sizeMap[size]}
      className={cn('animate-spin', variantStyles[variant], className)}
    />
  );
}

/**
 * Full-page spinner overlay
 *
 * @example
 * {isLoading && <PageSpinner />}
 */
export function PageSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <Spinner size="lg" variant="primary" />
      </div>
    </div>
  );
}
