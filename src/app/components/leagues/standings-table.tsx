import { Skeleton } from '@/app/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { StandingEntry, StandingsMovementMap } from '@/types/leagues';

interface StandingsTableProps {
  standings: StandingEntry[];
  movement?: StandingsMovementMap;
  computedAt?: string;
  isLoading?: boolean;
  currentUserId?: string;
  className?: string;
}

function formatComputedAt(value?: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDeltaUi(delta: number | undefined): {
  symbol: string;
  value: string;
  className: string;
} {
  if (!delta) {
    return { symbol: '•', value: '', className: 'text-slate-400' };
  }
  if (delta < 0) {
    return { symbol: '▲', value: `${delta}`, className: 'text-emerald-600' };
  }
  return { symbol: '▼', value: `+${delta}`, className: 'text-rose-500' };
}

export function StandingsTable({
  standings,
  movement,
  computedAt,
  isLoading,
  currentUserId,
  className,
}: StandingsTableProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-3 rounded-xl border border-slate-200 bg-white p-4', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((idx) => (
            <Skeleton key={idx} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className={cn('rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-center', className)}>
        <p className="text-sm text-slate-500">Aún no hay partidos registrados.</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white', className)}>
      <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
        Última actualización: {formatComputedAt(computedAt)}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="w-10 px-3 py-2.5 text-left text-xs font-semibold text-slate-600">#</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Jugador</th>
            <th className="w-14 px-3 py-2.5 text-center text-xs font-semibold text-slate-600">Pts</th>
            <th className="w-16 px-3 py-2.5 text-center text-xs font-semibold text-slate-600">Mov</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {standings.map((entry) => {
            const isMe = entry.userId === currentUserId;
            const delta = getDeltaUi(movement?.[entry.userId]);

            return (
              <tr
                key={entry.userId}
                className={cn('transition-colors', isMe && 'bg-blue-50/60 font-medium')}
              >
                <td className="px-3 py-3 font-semibold text-slate-500">{entry.position}</td>
                <td className="max-w-[160px] truncate px-3 py-3 text-slate-900">
                  {entry.displayName || 'Jugador'}
                  {isMe && <span className="ml-1.5 text-xs text-blue-600">(Vos)</span>}
                </td>
                <td className="px-3 py-3 text-center font-bold text-slate-900">{entry.points}</td>
                <td className={cn('px-3 py-3 text-center text-xs font-semibold', delta.className)}>
                  <span>{delta.symbol}</span>
                  {delta.value && <span className="ml-1">{delta.value}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
