import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatTileProps {
  /** The headline metric (number or pre-formatted string) */
  value: number | string;
  /** Short descriptive label shown below the value */
  label: string;
  /**
   * Signed delta displayed as a trend indicator.
   * Positive → emerald ▲, Negative → rose ▼, Zero/undefined → hidden.
   */
  delta?: number;
  /** Unit suffix next to the value (e.g. "pts", "ELO") */
  unit?: string;
  /** Controls the value font size */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const valueSizeClasses: Record<NonNullable<StatTileProps['size']>, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
};

/**
 * StatTile — DS v1 "number protagonist" display.
 *
 * Renders a large, bold metric with an optional label and signed delta indicator.
 * Numbers are the hero per DS v1: font-extrabold + tracking-tight.
 *
 * @example
 * ```tsx
 * <StatTile value={1420} label="ELO" delta={+15} size="lg" />
 * <StatTile value="8-2" label="Últimos 10" size="sm" />
 * ```
 */
export function StatTile({ value, label, delta, unit, size = 'md', className }: StatTileProps) {
  const hasDelta = typeof delta === 'number' && delta !== 0;
  const isUp = hasDelta && delta! > 0;

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {/* Value row */}
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            'font-extrabold tracking-tight text-slate-900',
            valueSizeClasses[size]
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-slate-500">{unit}</span>
        )}
      </div>

      {/* Label */}
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>

      {/* Delta indicator */}
      {hasDelta && (
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-xs font-semibold',
            isUp ? 'text-emerald-600' : 'text-rose-500'
          )}
        >
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta! > 0 ? '+' : ''}
          {delta}
        </span>
      )}
    </div>
  );
}
