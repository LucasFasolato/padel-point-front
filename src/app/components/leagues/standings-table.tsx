import { cn } from '@/lib/utils';
import type { StandingEntry } from '@/types/leagues';

interface StandingsTableProps {
  standings: StandingEntry[];
  currentUserId?: string;
  className?: string;
}

export function StandingsTable({ standings, currentUserId, className }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-center">
        <p className="text-sm text-slate-500">Aún no hay partidos registrados.</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200', className)}>
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 w-10">#</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Jugador</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 w-14">Pts</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 w-12">V</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 w-12">D</th>
            <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 w-12">E</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {standings.map((entry) => {
            const isMe = entry.userId === currentUserId;
            return (
              <tr
                key={entry.userId}
                className={cn(
                  'transition-colors',
                  isMe && 'bg-blue-50/60 font-medium',
                )}
              >
                <td className="px-3 py-3 text-slate-500 font-semibold">{entry.position}</td>
                <td className="px-3 py-3 text-slate-900 truncate max-w-[140px]">
                  {entry.displayName}
                  {isMe && <span className="ml-1.5 text-xs text-blue-600">(Vos)</span>}
                </td>
                <td className="px-3 py-3 text-center font-bold text-slate-900">{entry.points}</td>
                <td className="px-3 py-3 text-center text-emerald-600">{entry.wins}</td>
                <td className="px-3 py-3 text-center text-rose-500">{entry.losses}</td>
                <td className="px-3 py-3 text-center text-slate-500">{entry.draws}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
