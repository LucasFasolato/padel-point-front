'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, UserPlus, TrendingUp, Swords, Activity, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useLeagueActivity } from '@/hooks/use-leagues';
import { formatRelativeTime } from '@/lib/notification-utils';
import { cn } from '@/lib/utils';
import type { ActivityEventView } from '@/types/leagues';

// ---------------------------------------------------------------------------
// Event-type → icon chip helpers (for compact strip)
// ---------------------------------------------------------------------------

function getEventChip(type: string): { Icon: LucideIcon; colorClass: string } {
  const t = type.toLowerCase();
  if (t.includes('ranking')) return { Icon: TrendingUp, colorClass: 'bg-amber-100 text-amber-600' };
  if (t.includes('challenge')) return { Icon: Swords, colorClass: 'bg-orange-100 text-orange-600' };
  if (t.includes('member')) return { Icon: UserPlus, colorClass: 'bg-violet-100 text-violet-600' };
  if (t.includes('match')) {
    if (t.includes('confirmed')) return { Icon: Trophy, colorClass: 'bg-emerald-100 text-emerald-700' };
    if (t.includes('disputed') || t.includes('resolved'))
      return { Icon: Trophy, colorClass: 'bg-rose-100 text-rose-600' };
    return { Icon: Trophy, colorClass: 'bg-blue-100 text-blue-600' };
  }
  return { Icon: Activity, colorClass: 'bg-slate-100 text-slate-500' };
}

// ---------------------------------------------------------------------------
// Copy map for known event types
// ---------------------------------------------------------------------------

function getEventCopy(event: ActivityEventView, actor: string): string {
  // Normalize to lowercase so backend casing doesn't matter
  const type = event.type.toLowerCase();

  switch (type) {
    case 'match_reported':
      return `${actor} reportó un partido`;
    case 'match_confirmed':
      return `${actor} confirmó un partido`;
    case 'match_disputed':
      return `${actor} disputó el resultado de un partido`;
    case 'match_resolved':
      return 'Un partido fue resuelto por el administrador';
    case 'member_joined':
      return `${actor} se unió a la liga`;
    case 'member_invited':
      return `${actor} invitó a un jugador`;
    case 'league_started':
      return 'La liga comenzó';
    case 'league_finished':
      return 'La liga finalizó';
    case 'ranking_moved':
    case 'rankings_updated': {
      const delta = event.payload.delta;
      if (typeof delta === 'number' && delta < 0) {
        const pos = Math.abs(delta);
        return `${actor} subió ${pos} ${pos === 1 ? 'posición' : 'posiciones'} en la tabla`;
      }
      if (typeof delta === 'number' && delta > 0) {
        return `${actor} bajó ${delta} ${delta === 1 ? 'posición' : 'posiciones'} en la tabla`;
      }
      return 'Se actualizó la tabla de posiciones';
    }
    case 'challenge_issued':
      return `${actor} envió un desafío`;
    case 'challenge_accepted':
      return `${actor} aceptó un desafío`;
    case 'challenge_rejected':
      return `${actor} rechazó un desafío`;
    default:
      // If the backend sends a title/subtitle, prefer those
      if (event.payload.title && typeof event.payload.title === 'string') {
        return event.payload.title;
      }
      return 'Actividad en la liga';
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ActivityEventCard = memo(function ActivityEventCard({
  event,
  onNavigate,
}: {
  event: ActivityEventView;
  onNavigate?: (url: string) => void;
}) {
  const actor = event.actorName ?? 'Alguien';
  const copy = getEventCopy(event, actor);
  const initial = actor.charAt(0).toUpperCase();

  const matchId = typeof event.payload.matchId === 'string' ? event.payload.matchId : null;
  const isClickable = !!matchId && !!onNavigate;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3',
        isClickable && 'cursor-pointer hover:bg-slate-50 active:bg-slate-100',
      )}
      onClick={isClickable ? () => onNavigate(`/matches/${matchId}`) : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onNavigate(`/matches/${matchId}`);
            }
          : undefined
      }
    >
      <div
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700"
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-slate-900">{copy}</p>
        <p className="mt-0.5 text-xs text-slate-500">{formatRelativeTime(event.createdAt)}</p>
      </div>
    </div>
  );
});

function ActivitySkeleton() {
  return (
    <div className="space-y-2" aria-label="Cargando actividad">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface LeagueActivityFeedProps {
  leagueId: string;
  /** Optional: called when user taps "Cargar partido" in empty state. */
  onLoadResult?: () => void;
}

export const LeagueActivityFeed = memo(function LeagueActivityFeed({
  leagueId,
  onLoadResult,
}: LeagueActivityFeedProps) {
  const router = useRouter();
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useLeagueActivity(leagueId);

  const items = data?.items ?? [];
  const handleNavigate = (url: string) => router.push(url);

  if (isLoading) {
    return <ActivitySkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Sin actividad todavía</p>
        <p className="mt-1 text-xs text-slate-500">
          Cuando se confirme un partido o alguien se una, aparecerá aquí.
        </p>
        {onLoadResult && (
          <button
            type="button"
            onClick={onLoadResult}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:bg-emerald-800"
          >
            Cargar resultado
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((event) => (
        <ActivityEventCard key={event.id} event={event} onNavigate={handleNavigate} />
      ))}

      {hasNextPage && (
        <button
          type="button"
          onClick={() => void fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isFetchingNextPage ? 'Cargando…' : 'Ver más actividad'}
        </button>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// RecentActivityStrip — compact strip for the Resumen tab (last 5 items)
// ---------------------------------------------------------------------------

const STRIP_LIMIT = 5;

export interface RecentActivityStripProps {
  leagueId: string;
  onNavigate: (url: string) => void;
}

export const RecentActivityStrip = memo(function RecentActivityStrip({
  leagueId,
  onNavigate,
}: RecentActivityStripProps) {
  const { data, isLoading } = useLeagueActivity(leagueId, STRIP_LIMIT);
  const items = (data?.items ?? []).slice(0, STRIP_LIMIT);

  if (isLoading) {
    return (
      <div aria-label="Cargando actividad reciente">
        <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
          Actividad reciente
        </p>
        <div className="divide-y divide-slate-50 overflow-hidden rounded-2xl border border-slate-100 bg-white">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
        Actividad reciente
      </p>
      <div className="divide-y divide-slate-50 overflow-hidden rounded-2xl border border-slate-100 bg-white">
        {items.map((event) => {
          const actor = event.actorName ?? 'Alguien';
          const copy = getEventCopy(event, actor);
          const matchId =
            typeof event.payload.matchId === 'string' ? event.payload.matchId : null;
          const { Icon, colorClass } = getEventChip(event.type);

          return (
            <div
              key={event.id}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5',
                matchId && 'cursor-pointer hover:bg-slate-50 active:bg-slate-100',
              )}
              onClick={matchId ? () => onNavigate(`/matches/${matchId}`) : undefined}
              role={matchId ? 'button' : undefined}
              tabIndex={matchId ? 0 : undefined}
              onKeyDown={
                matchId
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        onNavigate(`/matches/${matchId}`);
                    }
                  : undefined
              }
            >
              <div
                aria-hidden="true"
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  colorClass,
                )}
              >
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-800">{copy}</p>
                <p className="text-[11px] text-slate-400">{formatRelativeTime(event.createdAt)}</p>
              </div>
              {matchId && (
                <ChevronRight size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
