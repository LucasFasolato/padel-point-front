import { ReactNode, ElementType } from 'react';
import { cn } from '@/lib/utils';

// ── CardHeader ────────────────────────────────────────────────────────────────

interface CardHeaderProps {
  /** Kicker label rendered in ALLCAPS tracking style */
  label: string;
  /** Optional icon chip rendered to the left of the label */
  icon?: ReactNode;
  /** Optional trailing action slot (e.g. a ghost button) */
  action?: ReactNode;
  className?: string;
}

/**
 * CardHeader — kicker label + optional icon chip for Card sections.
 *
 * @example
 * ```tsx
 * <Card padding="lg">
 *   <CardHeader label="Progreso" icon={<TrendingUp size={12} />} />
 *   <EloChart />
 * </Card>
 * ```
 */
export function CardHeader({ label, icon, action, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-center gap-2', className)}>
      {icon && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </span>
      )}
      <p className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Inner padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Makes the card interactive (renders as <button>) */
  onClick?: () => void;
  /** Override the root element (e.g. 'section', 'article') */
  as?: ElementType;
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/**
 * Card — DS v1 surface container.
 *
 * - rounded-2xl, subtle 1px border (no heavy shadows per DS)
 * - Interactive variant when `onClick` is provided (renders as <button>)
 *
 * @example
 * ```tsx
 * <Card padding="md">
 *   <StatTile value={1420} label="ELO" />
 * </Card>
 *
 * <Card onClick={() => router.push('/match/123')} padding="md">
 *   <ListItem title="vs Martín García" subtitle="Hace 2 días" />
 * </Card>
 * ```
 */
export function Card({ children, className, padding = 'md', onClick, as }: CardProps) {
  const Tag = (onClick ? 'button' : (as ?? 'div')) as ElementType;
  return (
    <Tag
      {...(onClick ? { onClick, type: 'button' } : {})}
      className={cn(
        'rounded-2xl border border-slate-100 bg-white',
        paddingClasses[padding],
        onClick &&
          'w-full cursor-pointer text-left transition-all hover:border-slate-200 hover:bg-slate-50 active:scale-[0.99]',
        className
      )}
    >
      {children}
    </Tag>
  );
}
