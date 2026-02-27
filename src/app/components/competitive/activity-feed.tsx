'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Activity,
  BarChart2,
  CheckCircle2,
  Clock,
  Loader2,
  Swords,
  TrendingDown,
  TrendingUp,
  Trophy,
  XCircle,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useMyActivity } from '@/hooks/use-activity';
import { normalizeActivityEventType, UNKNOWN_EVENT_TYPE } from '@/types/activity';
import { cn } from '@/lib/utils';
import type { RawActivityEvent } from '@/types/activity';

// ── Display config per canonical event type ───────────────────────────────────

type EventConfig = {
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  getTitle: (data: Record<string, unknown>) => string;
  getSubtitle: (data: Record<string, unknown>) => string | null;
  getCta: (data: Record<string, unknown>) => { href: string; label: string } | null;
};

const EVENT_CONFIG: Record<string, EventConfig> = {
  // ── Match lifecycle ────────────────────────────────────────────────────────

  MATCH_CONFIRMED: {
    Icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-[#0E7C66]',
    getTitle: (d) => (d.won ? 'Victoria confirmada' : 'Derrota registrada'),
    getSubtitle: (d) => {
      const parts: string[] = [];
      if (d.opponentName) parts.push(`vs ${String(d.opponentName)}`);
      if (d.score) parts.push(String(d.score));
      if (typeof d.eloChange === 'number') {
        parts.push(d.eloChange > 0 ? `+${d.eloChange} ELO` : `${d.eloChange} ELO`);
      }
      return parts.length > 0 ? parts.join(' · ') : null;
    },
    getCta: (d) =>
      d.matchId ? { href: `/matches/${String(d.matchId)}`, label: 'Ver partido' } : null,
  },

  MATCH_REPORTED: {
    Icon: Clock,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    getTitle: () => 'Resultado reportado',
    getSubtitle: (d) =>
      d.reporterName
        ? `Reportado por ${String(d.reporterName)}`
        : 'Pendiente de tu confirmación',
    getCta: (d) =>
      d.matchId ? { href: `/matches/${String(d.matchId)}`, label: 'Confirmar' } : null,
  },

  MATCH_DISPUTED: {
    Icon: XCircle,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    getTitle: () => 'Resultado disputado',
    getSubtitle: (d) =>
      d.opponentName ? `${String(d.opponentName)} disputó el resultado` : null,
    getCta: (d) =>
      d.matchId ? { href: `/matches/${String(d.matchId)}`, label: 'Ver detalles' } : null,
  },

  MATCH_RESOLVED: {
    Icon: CheckCircle2,
    iconBg: 'bg-slate-50',
    iconColor: 'text-slate-500',
    getTitle: () => 'Disputa resuelta',
    getSubtitle: (d) => (d.outcome ? String(d.outcome) : null),
    getCta: (d) =>
      d.matchId ? { href: `/matches/${String(d.matchId)}`, label: 'Ver partido' } : null,
  },

  // ── Challenge lifecycle ────────────────────────────────────────────────────

  CHALLENGE_CREATED: {
    Icon: Swords,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    getTitle: () => 'Nuevo desafío recibido',
    getSubtitle: (d) =>
      d.challengerName ? `${String(d.challengerName)} te desafió a un partido` : null,
    getCta: () => ({ href: '/competitive', label: 'Ver desafíos' }),
  },

  CHALLENGE_ACCEPTED: {
    Icon: Trophy,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-[#0E7C66]',
    getTitle: () => 'Desafío aceptado',
    getSubtitle: (d) =>
      d.opponentName ? `${String(d.opponentName)} aceptó tu desafío` : null,
    getCta: (d) =>
      d.challengeId
        ? {
            href: `/competitive/challenges/${String(d.challengeId)}/report`,
            label: 'Cargar resultado',
          }
        : null,
  },

  CHALLENGE_DECLINED: {
    Icon: XCircle,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    getTitle: () => 'Desafío rechazado',
    getSubtitle: (d) =>
      d.opponentName ? `${String(d.opponentName)} rechazó tu desafío` : null,
    getCta: () => null,
  },

  // ── ELO ───────────────────────────────────────────────────────────────────

  ELO_UPDATED: {
    Icon: Zap,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-[#0E7C66]',
    getTitle: (d) => {
      const delta = typeof d.delta === 'number' ? d.delta : 0;
      return delta >= 0 ? `+${delta} ELO` : `${delta} ELO`;
    },
    getSubtitle: (d) => {
      const reason = d.reason as string | undefined;
      if (reason === 'match_result') return 'Por resultado de partido';
      if (reason === 'init_category') return 'Categoría inicial asignada';
      if (reason === 'admin_adjustment') return 'Ajuste administrativo';
      if (d.newElo) return `ELO actual: ${d.newElo}`;
      return null;
    },
    getCta: (d) =>
      d.matchId ? { href: `/matches/${String(d.matchId)}`, label: 'Ver partido' } : null,
  },

  // ── Ranking ───────────────────────────────────────────────────────────────

  RANKING_MOVEMENT: {
    // Icon and colour resolved dynamically in ActivityCard based on direction
    Icon: TrendingUp,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-[#0E7C66]',
    getTitle: (d) => {
      const delta = typeof d.positionDelta === 'number' ? d.positionDelta : 0;
      if (delta > 0) return `Subiste ${delta} posición${delta !== 1 ? 'es' : ''} en el ranking`;
      if (delta < 0)
        return `Bajaste ${Math.abs(delta)} posición${Math.abs(delta) !== 1 ? 'es' : ''} en el ranking`;
      return 'Ranking sin cambios';
    },
    getSubtitle: (d) => (d.position ? `Posición actual: #${d.position}` : null),
    getCta: () => ({ href: '/competitive/rankings', label: 'Ver ranking' }),
  },

  RANKING_SNAPSHOT_PUBLISHED: {
    Icon: BarChart2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-[#0E7C66]',
    getTitle: () => 'Ranking actualizado',
    getSubtitle: (d) => {
      const parts: string[] = [];
      if (d.position) parts.push(`Posición #${d.position}`);
      if (d.elo) parts.push(`${d.elo} ELO`);
      return parts.length > 0 ? parts.join(' · ') : null;
    },
    getCta: () => ({ href: '/competitive/rankings', label: 'Ver ranking' }),
  },
};

// ── Activity card ─────────────────────────────────────────────────────────────

function ActivityCard({
  event,
  onNavigate,
}: {
  event: RawActivityEvent;
  onNavigate: (href: string) => void;
}) {
  const type = normalizeActivityEventType(event.type);

  // Skip unknown types entirely — never throw
  if (type === UNKNOWN_EVENT_TYPE) return null;

  const cfg = EVENT_CONFIG[type];

  // Unknown type not in display config — skip silently
  if (!cfg) return null;

  // Normalise data so all subsequent reads never receive null/undefined
  const safeData: Record<string, unknown> =
    event.data !== null &&
    typeof event.data === 'object' &&
    !Array.isArray(event.data)
      ? (event.data as Record<string, unknown>)
      : {};

  // Dynamic icon/colour for ranking movement direction
  const isRankingMoved = type === 'RANKING_MOVEMENT';
  const rankingDelta =
    isRankingMoved && typeof safeData.positionDelta === 'number'
      ? safeData.positionDelta
      : null;
  const isNegative = rankingDelta !== null && rankingDelta < 0;

  // Dynamic for ELO badge (red when negative)
  const isEloNegative =
    type === 'ELO_UPDATED' &&
    typeof safeData.delta === 'number' &&
    safeData.delta < 0;

  const resolvedIconBg = isNegative || isEloNegative ? 'bg-rose-50' : cfg.iconBg;
  const resolvedIconColor = isNegative || isEloNegative ? 'text-rose-500' : cfg.iconColor;
  const ResolvedIcon = isRankingMoved ? (isNegative ? TrendingDown : TrendingUp) : cfg.Icon;

  let title: string;
  let subtitle: string | null;
  let cta: { href: string; label: string } | null;
  try {
    title = cfg.getTitle(safeData);
    subtitle = cfg.getSubtitle(safeData);
    cta = cfg.getCta(safeData);
  } catch {
    return null;
  }

  const timeAgo = formatDistanceToNow(new Date(event.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className="flex items-start gap-3.5 px-4 py-4 transition-colors active:bg-slate-50/70">
      {/* Icon chip */}
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          resolvedIconBg,
        )}
        aria-hidden="true"
      >
        <ResolvedIcon className={cn('h-4 w-4', resolvedIconColor)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug text-slate-900">{title}</p>
          <time
            dateTime={event.createdAt}
            className="mt-px shrink-0 text-[10px] font-medium text-slate-400"
          >
            {timeAgo}
          </time>
        </div>

        {subtitle && (
          <p className="mt-0.5 text-xs leading-snug text-slate-500">{subtitle}</p>
        )}

        {cta && (
          <button
            type="button"
            onClick={() => onNavigate(cta.href)}
            className="mt-2.5 inline-flex min-h-[36px] items-center rounded-xl border border-[#0E7C66]/25 bg-[#0E7C66]/5 px-3 py-1.5 text-xs font-semibold text-[#0E7C66] transition-colors hover:bg-[#0E7C66]/10 active:bg-[#0E7C66]/15"
          >
            {cta.label} →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function ActivityCardSkeleton() {
  return (
    <div className="flex items-start gap-3.5 px-4 py-4">
      <Skeleton className="mt-0.5 h-9 w-9 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-52" />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function ActivityEmptyState() {
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
        <Activity className="h-4 w-4 text-slate-400" />
      </div>
      <p className="text-sm text-slate-500">Todavía no hay actividad</p>
    </div>
  );
}

// ── Feed ──────────────────────────────────────────────────────────────────────

export function ActivityFeed() {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMyActivity();

  const items = data?.items ?? [];

  // Memoised callbacks — stable references prevent child re-renders
  const handleNavigate = useCallback((href: string) => router.push(href), [router]);

  const tryFetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) tryFetchNext();
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [tryFetchNext]);

  // Graceful degradation: error with no cache → hide entirely
  if (isError && items.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
        <h2 className="text-sm font-bold text-slate-900">Actividad</h2>
      </div>

      {/* Cards */}
      <div className="divide-y divide-slate-50">
        {isLoading ? (
          <>
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
          </>
        ) : items.length === 0 ? (
          <ActivityEmptyState />
        ) : (
          items.map((event) => (
            <ActivityCard key={event.id} event={event} onNavigate={handleNavigate} />
          ))
        )}
      </div>

      {/* Infinite scroll sentinel (invisible) */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* Fetching-next indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center border-t border-slate-50 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      )}
    </section>
  );
}
