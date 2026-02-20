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

function getDeltaUi(delta: number | undefined, isNew: boolean): {
  symbol: string;
  value: string;
  className: string;
} {
  if (isNew) {
    return { symbol: '✨', value: '', className: 'text-amber-500' };
  }
  if (!delta) {
    return { symbol: '•', value: '', className: 'text-slate-400' };
  }
  if (delta < 0) {
    return { symbol: '↑', value: `+${Math.abs(delta)}`, className: 'text-emerald-600' };
  }
  return { symbol: '↓', value: `-${delta}`, className: 'text-rose-500' };
}

interface Mover {
  displayName: string;
  delta: number;
}

function getTopMovers(
  standings: StandingEntry[],
  movement?: StandingsMovementMap,
): { up: Mover[]; down: Mover[] } | null {
  if (!movement || Object.keys(movement).length === 0) return null;

  const movers: Mover[] = [];
  for (const entry of standings) {
    const d = movement[entry.userId];
    if (d != null && d !== 0) {
      movers.push({ displayName: entry.displayName || 'Jugador', delta: d });
    }
  }
  if (movers.length === 0) return null;

  // delta < 0 means position decreased → moved UP
  const up = movers
    .filter((m) => m.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3);
  const down = movers
    .filter((m) => m.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  if (up.length === 0 && down.length === 0) return null;
  return { up, down };
}

function formatDiff(value?: number): string {
  if (value == null) return '-';
  return value > 0 ? `+${value}` : `${value}`;
}

function diffColor(value?: number): string {
  if (value == null || value === 0) return '';
  return value > 0 ? 'text-emerald-600' : 'text-rose-500';
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

  const hasSetDiff = standings.some((s) => s.setDiff != null);
  const hasGameDiff = standings.some((s) => s.gameDiff != null);
  const hasMovement = !!movement && Object.keys(movement).length > 0;
  const topMovers = getTopMovers(standings, movement);

  return (
    <div className={cn('space-y-2', className)}>
      {topMovers && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
          {topMovers.up.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-emerald-600">↑</span>
              {topMovers.up.map((m) => (
                <span key={m.displayName} className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                  {m.displayName} <span className="font-semibold">+{Math.abs(m.delta)}</span>
                </span>
              ))}
            </div>
          )}
          {topMovers.down.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-rose-500">↓</span>
              {topMovers.down.map((m) => (
                <span key={m.displayName} className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-rose-600">
                  {m.displayName} <span className="font-semibold">-{m.delta}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
        <span>Última actualización: {formatComputedAt(computedAt)}</span>
        <span className="text-slate-400" title="Desempate: Victorias → Dif. sets → Dif. games → Victorias recientes">
          Desempate: V → ±Sets → ±Games → V rec.
        </span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="w-10 px-3 py-2.5 text-left text-xs font-semibold text-slate-600">#</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">Jugador</th>
            <th className="w-14 px-3 py-2.5 text-center text-xs font-semibold text-slate-600">Pts</th>
            <th className="w-14 px-3 py-2.5 text-center text-xs font-semibold text-slate-600">V/D</th>
            {hasSetDiff && (
              <th className="w-14 px-3 py-2.5 text-center text-xs font-semibold text-slate-600">±S</th>
            )}
            {hasGameDiff && (
              <th className="w-14 px-3 py-2.5 text-center text-xs font-semibold text-slate-600">±G</th>
            )}
            <th className="w-16 px-3 py-2.5 text-center text-xs font-semibold text-slate-600">Mov</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {standings.map((entry) => {
            const isMe = entry.userId === currentUserId;
            const isNew = hasMovement && movement[entry.userId] == null;
            const delta = getDeltaUi(movement?.[entry.userId], isNew);

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
                <td className="px-3 py-3 text-center text-slate-700">{entry.wins}/{entry.losses}</td>
                {hasSetDiff && (
                  <td className={cn('px-3 py-3 text-center text-slate-700', diffColor(entry.setDiff))}>
                    {formatDiff(entry.setDiff)}
                  </td>
                )}
                {hasGameDiff && (
                  <td className={cn('px-3 py-3 text-center text-slate-700', diffColor(entry.gameDiff))}>
                    {formatDiff(entry.gameDiff)}
                  </td>
                )}
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
    </div>
  );
}
