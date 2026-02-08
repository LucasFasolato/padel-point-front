import { cn } from '@/lib/utils';
import { getStatusLabel, getStatusColors } from '@/lib/league-utils';

interface LeagueStatusBadgeProps {
  status: string;
  className?: string;
}

export function LeagueStatusBadge({ status, className }: LeagueStatusBadgeProps) {
  const colors = getStatusColors(status);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        colors.bg,
        colors.text,
        className,
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
