import { Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateRange } from '@/lib/league-utils';
import { LeagueStatusBadge } from './league-status-badge';
import type { League } from '@/types/leagues';

interface LeagueCardProps {
  league: League;
  onClick?: () => void;
  className?: string;
}

export function LeagueCard({ league, onClick, className }: LeagueCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300',
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 truncate pr-2">
          {league.name}
        </h3>
        <LeagueStatusBadge status={league.status} />
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} className="text-slate-400" />
          {formatDateRange(league.startDate, league.endDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-slate-400" />
          {league.membersCount}
        </span>
      </div>
    </div>
  );
}
