import { cn } from '@/lib/utils';
import type { StandingEntry, StandingsMovementMap } from '@/types/leagues';

interface LeagueShareCardProps {
  leagueName: string;
  standings: StandingEntry[];
  movement?: StandingsMovementMap;
  computedAt?: string;
  className?: string;
}

function formatComputedAt(value?: string): string {
  if (!value) return 'Actualizado recientemente';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Actualizado recientemente';
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMovementArrow(delta?: number): { arrow: string; className: string } | null {
  if (typeof delta !== 'number' || delta === 0) return null;
  if (delta < 0) {
    return { arrow: '\u25B2', className: 'text-emerald-600' };
  }
  return { arrow: '\u25BC', className: 'text-rose-500' };
}

export function LeagueShareCard({
  leagueName,
  standings,
  movement,
  computedAt,
  className,
}: LeagueShareCardProps) {
  const topFive = standings.slice(0, 5);
  const showMovement = Boolean(movement && Object.keys(movement).length > 0);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-emerald-50/40 to-slate-50 p-4 shadow-sm',
        className
      )}
      data-testid="league-share-card"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl" />
      <div className="pointer-events-none absolute bottom-2 right-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-200">
        PADELPOINT
      </div>

      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Compartir tabla
            </p>
            <h3 className="text-base font-bold text-slate-900">{leagueName || 'Liga'}</h3>
          </div>
          <div className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
            {formatComputedAt(computedAt)}
          </div>
        </div>

        {topFive.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 px-3 py-6 text-center text-sm text-slate-500">
            Todavía no hay posiciones para compartir.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/90">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/90">
                <tr>
                  <th className="w-10 px-3 py-2 text-left text-xs font-semibold text-slate-600">#</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Jugador</th>
                  <th className="w-12 px-3 py-2 text-center text-xs font-semibold text-slate-600">Pts</th>
                  {showMovement && (
                    <th className="w-12 px-3 py-2 text-center text-xs font-semibold text-slate-600">
                      Mov
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topFive.map((row) => {
                  const movementArrow = getMovementArrow(movement?.[row.userId]);
                  return (
                    <tr key={row.userId}>
                      <td className="px-3 py-2.5 font-semibold text-slate-500">{row.position}</td>
                      <td className="max-w-[180px] truncate px-3 py-2.5 text-slate-900">
                        {row.displayName || 'Jugador'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-900">{row.points}</td>
                      {showMovement && (
                        <td className="px-3 py-2.5 text-center">
                          {movementArrow ? (
                            <span
                              data-testid={`share-movement-${row.userId}`}
                              className={cn('text-xs font-semibold', movementArrow.className)}
                            >
                              {movementArrow.arrow}
                            </span>
                          ) : (
                            <span
                              data-testid={`share-movement-${row.userId}`}
                              className="text-xs text-slate-300"
                            >
                              -
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>PadelPoint</span>
          <span>Top {Math.min(5, standings.length)}</span>
        </div>
      </div>
    </div>
  );
}
