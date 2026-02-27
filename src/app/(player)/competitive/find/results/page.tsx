'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, MapPin, TrendingUp } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import { useRivalSuggestions } from '@/hooks/use-rival-suggestions';
import { usePartnerSuggestions } from '@/hooks/use-partner-suggestions';
import {
  useCreateDirectChallenge,
  useCreateOpenChallenge,
} from '@/hooks/use-challenges';
import { useCompetitiveProfile } from '@/hooks/use-competitive-profile';
import { cn } from '@/lib/utils';
import type { FindMode } from '../page';
import type { MatchType } from '@/types/competitive';
import type { RivalItem } from '@/services/competitive-service';

const CATEGORY_LABELS: Record<number, string> = {
  1: '1ra', 2: '2da', 3: '3ra', 4: '4ta',
  5: '5ta', 6: '6ta', 7: '7ma', 8: '8va',
};

const MODE_LABELS: Record<FindMode, string> = {
  FIND_RIVAL: 'rival',
  FIND_PARTNER: 'compañero',
  FIND_TEAM: 'pareja rival',
};

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  COMPETITIVE: 'Competitivo',
  FRIENDLY: 'Amistoso',
};

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = (searchParams.get('mode') as FindMode | null) ?? 'FIND_RIVAL';
  const matchType = (searchParams.get('matchType') as MatchType | null) ?? 'COMPETITIVE';
  const position = searchParams.get('position') ?? 'DRIVE';
  const categoryParam = Number(searchParams.get('category')) || undefined;
  const sameCategory = searchParams.get('sameCategory') !== 'false';

  // Invite sheet state
  const [selectedPlayer, setSelectedPlayer] = useState<RivalItem | null>(null);
  const [sheetMatchType, setSheetMatchType] = useState<MatchType>(matchType);
  const [message, setMessage] = useState('');
  const [sentUserIds, setSentUserIds] = useState<string[]>([]);

  const createDirect = useCreateDirectChallenge();
  const createOpen = useCreateOpenChallenge();
  const { data: profile } = useCompetitiveProfile();

  const filters = {
    limit: 20,
    sameCategory,
  };

  const rivalsQuery = useRivalSuggestions(filters, {
    enabled: mode === 'FIND_RIVAL' || mode === 'FIND_TEAM',
  });
  const partnersQuery = usePartnerSuggestions(filters, {
    enabled: mode === 'FIND_PARTNER',
  });

  const activeQuery = mode === 'FIND_PARTNER' ? partnersQuery : rivalsQuery;
  const players = activeQuery.data?.items ?? [];

  const openInviteSheet = (player: RivalItem) => {
    setSelectedPlayer(player);
    setSheetMatchType(matchType);
    setMessage('');
  };

  const closeSheet = () => {
    setSelectedPlayer(null);
    setMessage('');
  };

  const handleSendInvite = async () => {
    if (!selectedPlayer) return;

    const userId = selectedPlayer.userId;

    try {
      if (mode === 'FIND_RIVAL' || mode === 'FIND_TEAM') {
        await createDirect.mutateAsync({
          opponentUserId: userId,
          matchType: sheetMatchType,
          message: message.trim() || undefined,
        });
      } else {
        // FIND_PARTNER: direct challenge where the found player becomes partner
        // Navigate to new challenge flow with partner pre-filled
        closeSheet();
        router.push(
          `/competitive/challenges/new?partnerUserId=${encodeURIComponent(userId)}`,
        );
        return;
      }
      setSentUserIds((prev) => [...prev, userId]);
      closeSheet();
    } catch {
      // error handled by mutation toast
    }
  };

  const isPending = createDirect.isPending;

  // Active filter chips
  const chips: string[] = [
    MATCH_TYPE_LABELS[matchType],
    position === 'DRIVE' ? 'Drive' : 'Revés',
    categoryParam ? CATEGORY_LABELS[categoryParam] ?? `Cat ${categoryParam}` : '',
  ].filter(Boolean);

  // City from profile — display only
  const city = profile ? undefined : undefined; // city comes from player profile; show in header

  return (
    <>
      <PublicTopBar
        title={`Buscar ${MODE_LABELS[mode]}`}
        backHref={`/competitive/find/configure?mode=${mode}`}
      />

      <div className="space-y-4 px-4 py-4 pb-6">
        {/* Active filter chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Results */}
        {activeQuery.isLoading ? (
          <ResultsSkeleton />
        ) : activeQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
            <p className="text-sm font-semibold text-rose-900">No pudimos cargar sugerencias</p>
            <p className="mt-1 text-xs text-rose-700">Revisá tu conexión y reintentá.</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => activeQuery.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : players.length === 0 ? (
          <EmptyResults mode={mode} />
        ) : (
          <>
            <div className="space-y-3">
              {players.map((player) => (
                <PlayerCard
                  key={player.userId}
                  player={player}
                  sent={sentUserIds.includes(player.userId)}
                  mode={mode}
                  onInvite={() => openInviteSheet(player)}
                />
              ))}
            </div>

            {activeQuery.hasNextPage && (
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => activeQuery.fetchNextPage()}
                loading={activeQuery.isFetchingNextPage}
              >
                {activeQuery.isFetchingNextPage ? 'Cargando...' : 'Ver más jugadores'}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Invite confirmation sheet */}
      {selectedPlayer && (
        <InviteSheet
          player={selectedPlayer}
          mode={mode}
          matchType={sheetMatchType}
          message={message}
          isPending={isPending}
          onMatchTypeChange={setSheetMatchType}
          onMessageChange={setMessage}
          onClose={closeSheet}
          onConfirm={handleSendInvite}
        />
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlayerCard({
  player,
  sent,
  mode,
  onInvite,
}: {
  player: RivalItem;
  sent: boolean;
  mode: FindMode;
  onInvite: () => void;
}) {
  const locationParts = [player.location?.city, player.location?.province]
    .filter(Boolean)
    .join(', ');

  const positionTag = player.tags.find(
    (t) => t === 'right-side' || t === 'left-side'
  );
  const positionLabel = positionTag === 'right-side' ? 'Drive' : positionTag === 'left-side' ? 'Revés' : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">
            {player.displayName}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <CategoryBadge category={player.category as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8} size="sm" />
            <span className="text-sm font-medium text-slate-700">ELO {player.elo}</span>
            {positionLabel && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {positionLabel}
              </span>
            )}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          disabled={sent}
          className={cn('shrink-0 min-w-[88px]', sent && 'opacity-60')}
          onClick={onInvite}
        >
          {sent ? '✓ Enviado' : mode === 'FIND_PARTNER' ? 'Invitar' : 'Invitar'}
        </Button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        {player.matches30d > 0 && (
          <span>Actividad 30d: {player.matches30d} partidos</span>
        )}
        {player.momentum30d !== 0 && (
          <span className="inline-flex items-center gap-1">
            <TrendingUp size={11} />
            {player.momentum30d > 0 ? '+' : ''}{player.momentum30d}
          </span>
        )}
        {locationParts && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} />
            {locationParts}
          </span>
        )}
      </div>
    </article>
  );
}

function InviteSheet({
  player,
  mode,
  matchType,
  message,
  isPending,
  onMatchTypeChange,
  onMessageChange,
  onClose,
  onConfirm,
}: {
  player: RivalItem;
  mode: FindMode;
  matchType: MatchType;
  message: string;
  isPending: boolean;
  onMatchTypeChange: (mt: MatchType) => void;
  onMessageChange: (m: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-t-3xl bg-white px-5 pb-8 pt-6 shadow-2xl">
        {/* Handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-200" />

        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Confirmar invitación</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {mode === 'FIND_PARTNER' ? 'Como compañero' : 'Como rival'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Player summary */}
        <div className="mb-5 rounded-2xl border border-slate-100 bg-[#F7F8FA] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{player.displayName}</p>
              <div className="mt-1 flex items-center gap-2">
                <CategoryBadge
                  category={player.category as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
                  size="sm"
                />
                <span className="text-sm text-slate-500">ELO {player.elo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Match type toggle */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tipo de partido
          </p>
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
            {(['COMPETITIVE', 'FRIENDLY'] as MatchType[]).map((mt) => (
              <button
                key={mt}
                type="button"
                onClick={() => onMatchTypeChange(mt)}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  matchType === mt
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {mt === 'COMPETITIVE' ? 'Competitivo' : 'Amistoso'}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            {matchType === 'COMPETITIVE'
              ? 'Impacta el ranking de ambos jugadores'
              : 'Solo registro personal, no afecta ranking'}
          </p>
        </div>

        {/* Optional message */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Mensaje (opcional)
          </p>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Ej: Hola, ¿podemos jugar este finde?"
            rows={2}
            maxLength={200}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0E7C66] focus:ring-2 focus:ring-[#0E7C66]/20 placeholder:text-slate-400"
          />
        </div>

        {/* CTA */}
        <Button
          fullWidth
          size="lg"
          loading={isPending}
          onClick={onConfirm}
        >
          Enviar invitación
        </Button>
      </div>
    </>
  );
}

function EmptyResults({ mode }: { mode: FindMode }) {
  const router = useRouter();
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
      <p className="text-base font-semibold text-slate-900">
        No hay jugadores que coincidan
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Ajustá los filtros para ampliar la búsqueda.
      </p>
      <div className="mt-5 flex flex-col items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => router.push(`/competitive/find/configure?mode=${mode}`)}
        >
          Cambiar filtros
        </Button>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-10 w-20 rounded-xl" />
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <>
          <PublicTopBar title="Buscando..." backHref="/competitive/find" />
          <div className="space-y-4 px-4 py-4">
            <ResultsSkeleton />
          </div>
        </>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
