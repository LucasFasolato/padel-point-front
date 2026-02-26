import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icon element displayed in a circular container (e.g. <Trophy size={28} />) */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Optional CTA rendered below the description (e.g. <Button>) */
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState — DS v1 empty list / zero-data placeholder.
 *
 * Centers vertically within its container. Use inside a Card or full-page section.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<Trophy size={28} />}
 *   title="Sin partidos aún"
 *   description="Jugá tu primer partido para ver resultados acá."
 *   action={<Button>Buscar rival</Button>}
 * />
 * ```
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        className
      )}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}

      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        {description && (
          <p className="text-sm leading-relaxed text-slate-500">{description}</p>
        )}
      </div>

      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
