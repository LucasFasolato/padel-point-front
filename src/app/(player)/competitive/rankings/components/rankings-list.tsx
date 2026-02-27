import { cn } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/lib/competitive-utils';
import type { RankingEntry } from '@/types/competitive';

// ─── Helpers ────────────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.[0] ?? '?').toUpperCase();
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

function PositionBadge({ position }: { position: number }) {
  const base = 'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold shadow-sm';
  if (position === 1)
    return <span className={cn(base, 'bg-amber-400 text-white')}>1</span>;
  if (position === 2)
    return <span className={cn(base, 'bg-slate-300 text-slate-700')}>2</span>;
  if (position === 3)
    return <span className={cn(base, 'bg-amber-700 text-white')}>3</span>;
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center text-sm font-semibold text-slate-400">
      {position}
    </span>
  );
}

function DeltaBadge({ delta }: { delta?: number | null }) {
  if (typeof delta !== 'number') return null;
  if (delta > 0)
    return <span className="text-[10px] font-bold text-emerald-500">▲{delta}</span>;
  if (delta < 0)
    return <span className="text-[10px] font-bold text-rose-500">▼{Math.abs(delta)}</span>;
  return <span className="text-[10px] font-semibold text-slate-300">—</span>;
}

// ─── Row ────────────────────────────────────────────────────────────────────

function RankingRow({
  entry,
  index,
  isCurrentUser,
}: {
  entry: RankingEntry;
  index: number;
  isCurrentUser: boolean;
}) {
  const position = entry.position ?? index + 1;

  return (
    <div
      className={cn(
        'flex min-h-[56px] items-center gap-3 px-4 py-3 transition-colors',
        isCurrentUser ? 'bg-emerald-50/70' : 'hover:bg-slate-50/60',
      )}
    >
      {/* Position */}
      <div className="flex w-9 shrink-0 flex-col items-center gap-0.5">
        <PositionBadge position={position} />
        <DeltaBadge delta={entry.positionDelta} />
      </div>

      {/* Avatar */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold',
          isCurrentUser
            ? 'bg-[#0E7C66] text-white'
            : 'bg-slate-100 text-slate-500',
        )}
      >
        {initials(entry.displayName)}
      </div>

      {/* Name + category */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate">
          <span
            className={cn(
              'truncate text-sm font-semibold',
              isCurrentUser ? 'text-emerald-900' : 'text-slate-800',
            )}
          >
            {entry.displayName}
          </span>
          {isCurrentUser && (
            <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-emerald-700">
              Vos
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] font-medium text-slate-400">
          {CATEGORY_LABELS[entry.category]}
        </p>
      </div>

      {/* ELO */}
      <div className="shrink-0 text-right">
        <p
          className={cn(
            'text-base font-extrabold tracking-tight',
            isCurrentUser ? 'text-[#0E7C66]' : 'text-slate-900',
          )}
        >
          {entry.elo}
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">ELO</p>
      </div>
    </div>
  );
}

// ─── List ────────────────────────────────────────────────────────────────────

interface RankingsListProps {
  items: RankingEntry[];
  currentUserId?: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function RankingsList({
  items,
  currentUserId,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: RankingsListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
        <p className="text-sm font-semibold text-slate-600">No hay jugadores en este ranking</p>
        <p className="mt-1.5 text-xs text-slate-400">
          Jugá partidos competitivos para que aparezcan resultados
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="divide-y divide-slate-100">
        {items.map((entry, i) => (
          <RankingRow
            key={entry.userId}
            entry={entry}
            index={i}
            isCurrentUser={entry.userId === currentUserId}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  );
}
