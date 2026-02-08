import { cn } from '@/lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/league-utils';
import type { LeagueStatus } from '@/types/leagues';

interface LeagueStatusBadgeProps {
  status: LeagueStatus;
  className?: string;
}

export function LeagueStatusBadge({ status, className }: LeagueStatusBadgeProps) {
  const colors = STATUS_COLORS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        colors.bg,
        colors.text,
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
