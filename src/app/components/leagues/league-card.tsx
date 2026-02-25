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
  const initials = league.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

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
        'flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300',
        className,
      )}
    >
      {/* League avatar or initials */}
      {league.avatarUrl ? (
        <img
          src={league.avatarUrl}
          alt={league.name}
          className="h-11 w-11 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700">
          {initials || '?'}
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-900">{league.name}</h3>
          <LeagueStatusBadge status={league.status} />
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar size={11} className="text-slate-400" />
            {formatDateRange(league.startDate, league.endDate)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} className="text-slate-400" />
            {league.membersCount}
          </span>
        </div>
      </div>
    </div>
  );
}
