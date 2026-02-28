'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, X } from 'lucide-react';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useRivalSuggestions } from '@/hooks/use-rival-suggestions';
import { useCreateDirectChallenge } from '@/hooks/use-challenges';
import { useMyPlayerProfile } from '@/hooks/use-player-profile';
import { useCompetitiveProfile } from '@/hooks/use-competitive-profile';
import { cn } from '@/lib/utils';
import type { MatchType } from '@/types/competitive';
import type { RivalItem } from '@/services/competitive-service';

// ── Scope filter ──────────────────────────────────────────────────────────────

type ScopeKey = 'city' | 'province' | 'country' | 'all';
type OrderKey = 'elo' | 'activity';

const SCOPE_LABELS: Record<ScopeKey, string> = {
  city: 'Mi ciudad',
  province: 'Mi provincia',
  country: 'Mi país',
  all: 'Global',
};

const ORDER_LABELS: Record<OrderKey, string> = {
  elo: 'Cerca de tu ELO',
  activity: 'Más activos',
};

function buildLocationParams(
  scope: ScopeKey,
  profile: ReturnType<typeof useMyPlayerProfile>['data']
): { city?: string; province?: string; country?: string } {
  const loc = profile?.location;
  switch (scope) {
    case 'city':
      return { city: loc?.city ?? undefined };
    case 'province':
      return { province: loc?.province ?? undefined };
    case 'country':
      return { country: loc?.country ?? 'AR' };
    case 'all':
    default:
      return {};
  }
}

function buildMicrofact(rival: RivalItem): string | null {
  const count = rival.matches30d ?? 0;
  if (count > 0) {
    return `${count} ${count === 1 ? 'partido' : 'partidos'} · últ. 30 días`;
  }
  if ((rival.momentum30d ?? 0) > 0) return 'Activo recientemente';
  return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const router = useRouter();

  const [scope, setScope] = useState<ScopeKey>('city');
  const [order, setOrder] = useState<OrderKey>('elo');
  const [sameCat, setSameCat] = useState(true);
  const [challengeTarget, setChallengeTarget] = useState<RivalItem | null>(null);
  const [matchMode, setMatchMode] = useState<MatchType>('COMPETITIVE');
  const [message, setMessage] = useState('');
  const [sentIds, setSentIds] = useState<string[]>([]);

  const profileQuery = useMyPlayerProfile();
  const profile = profileQuery.data;
  const compProfileQuery = useCompetitiveProfile();
  const myElo = compProfileQuery.data?.elo;

  const locationParams = buildLocationParams(scope, profile);

  const rivalsQuery = useRivalSuggestions(
    { limit: 20, ...locationParams, sameCategory: sameCat },
    { enabled: !profileQuery.isLoading }
  );

  const rawRivals = rivalsQuery.data?.items ?? [];

  const rivals = useMemo(() => {
    if (!rawRivals.length) return rawRivals;
    if (order === 'activity') {
      return [...rawRivals].sort(
        (a, b) =>
          (b.matches30d ?? 0) - (a.matches30d ?? 0) ||
          (b.momentum30d ?? 0) - (a.momentum30d ?? 0)
      );
    }
    // 'elo': closest ELO gap first
    if (myElo != null) {
      return [...rawRivals].sort(
        (a, b) => Math.abs(a.elo - myElo) - Math.abs(b.elo - myElo)
      );
    }
    return rawRivals;
  }, [rawRivals, order, myElo]);

  const createChallenge = useCreateDirectChallenge();

  const openModal = (rival: RivalItem) => {
    setChallengeTarget(rival);
    setMatchMode('COMPETITIVE');
    setMessage('');
  };

  const closeModal = () => {
    setChallengeTarget(null);
    setMessage('');
  };

  const handleChallenge = async () => {
    if (!challengeTarget) return;
    try {
      await createChallenge.mutateAsync({
        opponentUserId: challengeTarget.userId,
        matchType: matchMode,
        message: message.trim() || undefined,
      });
      setSentIds((prev) => [...prev, challengeTarget.userId]);
      closeModal();
      router.push('/competitive');
    } catch {
      // error already toasted by the hook
    }
  };

  const isLoading = profileQuery.isLoading || rivalsQuery.isLoading;

  return (
    <>
      <PublicTopBar title="Descubrí rivales" backHref="/competitive" />

      <div className="space-y-3 px-4 py-4">
        {/* ── Scope filter pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {(Object.keys(SCOPE_LABELS) as ScopeKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setScope(key)}
              className={cn(
                'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                scope === key
                  ? 'bg-[#0E7C66] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {SCOPE_LABELS[key]}
            </button>
          ))}
        </div>

        {/* ── Order + Category chips ── */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          {(Object.keys(ORDER_LABELS) as OrderKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setOrder(key)}
              className={cn(
                'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
                order === key
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {ORDER_LABELS[key]}
            </button>
          ))}

          <span className="flex shrink-0 items-center px-1 text-slate-300" aria-hidden>
            ·
          </span>

          {/* Category toggle */}
          <button
            type="button"
            onClick={() => setSameCat((v) => !v)}
            aria-pressed={sameCat}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
              sameCat
                ? 'bg-[#0E7C66]/10 text-[#0E7C66] ring-1 ring-inset ring-[#0E7C66]/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            Mi categoría
          </button>
        </div>

        {/* ── Location context ── */}
        {profile?.location?.city && scope !== 'all' && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <MapPin size={12} />
            <span>
              {scope === 'city' && profile.location.city}
              {scope === 'province' && (profile.location.province ?? profile.location.city)}
              {scope === 'country' && (profile.location.country ?? 'Argentina')}
            </span>
          </div>
        )}

        {/* ── Candidate list ── */}
        {isLoading ? (
          <DiscoverSkeleton />
        ) : rivalsQuery.isError ? (
          <DiscoverError onRetry={() => rivalsQuery.refetch()} />
        ) : rivals.length === 0 ? (
          <DiscoverEmpty
            scope={scope}
            onExpand={() => {
              const wider: Record<ScopeKey, ScopeKey> = {
                city: 'province',
                province: 'country',
                country: 'all',
                all: 'all',
              };
              setScope(wider[scope]);
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="divide-y divide-slate-50">
              {rivals.map((rival) => (
                <CandidateRow
                  key={rival.userId}
                  rival={rival}
                  sent={sentIds.includes(rival.userId)}
                  onChallenge={() => openModal(rival)}
                />
              ))}
            </div>

            {/* Load more */}
            {rivalsQuery.hasNextPage && (
              <div className="border-t border-slate-100 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  loading={rivalsQuery.isFetchingNextPage}
                  onClick={() => rivalsQuery.fetchNextPage()}
                >
                  Ver más jugadores
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Challenge confirmation modal ── */}
      {challengeTarget && (
        <ChallengeModal
          rival={challengeTarget}
          matchMode={matchMode}
          message={message}
          isPending={createChallenge.isPending}
          onMatchModeChange={setMatchMode}
          onMessageChange={setMessage}
          onConfirm={handleChallenge}
          onClose={closeModal}
        />
      )}
    </>
  );
}

// ── Candidate row ─────────────────────────────────────────────────────────────

function CandidateRow({
  rival,
  sent,
  onChallenge,
}: {
  rival: RivalItem;
  sent: boolean;
  onChallenge: () => void;
}) {
  const initials = rival.displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const location = [rival.location?.city, rival.location?.province]
    .filter(Boolean)
    .join(', ');

  const microfact = buildMicrofact(rival);

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* Avatar */}
      <div
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0E7C66]/10 text-sm font-bold text-[#0E7C66]"
      >
        {initials}
      </div>

      {/* Name + category + location + microfact */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-slate-900">{rival.displayName}</p>
          {rival.category != null && (
            <CategoryBadge
              category={rival.category as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
              size="sm"
            />
          )}
        </div>

        {(location || microfact) && (
          <div className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-slate-400">
            {location && (
              <>
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{location}</span>
              </>
            )}
            {location && microfact && (
              <span className="shrink-0 text-slate-300" aria-hidden>
                ·
              </span>
            )}
            {microfact && (
              <span className="shrink-0 font-medium text-emerald-600">{microfact}</span>
            )}
          </div>
        )}
      </div>

      {/* ELO chip */}
      {rival.elo != null && (
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          {rival.elo}
        </span>
      )}

      {/* Desafiar */}
      <button
        type="button"
        onClick={onChallenge}
        disabled={sent}
        className={cn(
          'flex min-h-[44px] shrink-0 items-center rounded-xl px-4 text-xs font-bold transition-all active:scale-[0.97]',
          sent
            ? 'cursor-default bg-slate-100 text-slate-400'
            : 'bg-[#0E7C66] text-white hover:bg-[#0B6B58]'
        )}
      >
        {sent ? '✓ Enviado' : 'Desafiar'}
      </button>
    </div>
  );
}

// ── Challenge modal ───────────────────────────────────────────────────────────

function ChallengeModal({
  rival,
  matchMode,
  message,
  isPending,
  onMatchModeChange,
  onMessageChange,
  onConfirm,
  onClose,
}: {
  rival: RivalItem;
  matchMode: MatchType;
  message: string;
  isPending: boolean;
  onMatchModeChange: (m: MatchType) => void;
  onMessageChange: (m: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const initials = rival.displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />

      {/* Centered panel */}
      <div
        role="dialog"
        aria-modal
        aria-label={`Desafiar a ${rival.displayName}`}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Crear desafío</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X size={15} />
          </button>
        </div>

        {/* Rival summary */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[#F7F8FA] px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0E7C66]/10 text-sm font-bold text-[#0E7C66]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{rival.displayName}</p>
            {rival.location?.city && (
              <p className="text-xs text-slate-400">{rival.location.city}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {rival.category != null && (
              <CategoryBadge
                category={rival.category as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
                size="sm"
              />
            )}
            {rival.elo != null && (
              <span className="text-xs font-bold text-slate-500">ELO {rival.elo}</span>
            )}
          </div>
        </div>

        {/* Match mode toggle */}
        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Tipo de partido
          </p>
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
            {(['COMPETITIVE', 'FRIENDLY'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onMatchModeChange(mode)}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-[10px] py-2 text-xs font-bold transition-all',
                  matchMode === mode
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                {mode === 'COMPETITIVE' ? 'Competitivo' : 'Amistoso'}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {matchMode === 'COMPETITIVE'
              ? 'Impacta el ranking de ambos jugadores'
              : 'Solo registro personal, sin impacto en ranking'}
          </p>
        </div>

        {/* Message */}
        <div className="mb-5">
          <label
            htmlFor="discover-message"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400"
          >
            Mensaje (opcional)
          </label>
          <textarea
            id="discover-message"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Ej: ¿Jugamos este finde?"
            rows={2}
            maxLength={200}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-[#0E7C66] focus:bg-white focus:ring-2 focus:ring-[#0E7C66]/20"
          />
        </div>

        {/* CTA */}
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth
          loading={isPending}
          onClick={onConfirm}
        >
          Desafiar
        </Button>
      </div>
    </>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DiscoverSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="divide-y divide-slate-50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-32 rounded" />
                <Skeleton className="h-4 w-10 rounded-full" />
              </div>
              <Skeleton className="h-3 w-44 rounded" />
            </div>
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-11 w-[84px] rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function DiscoverEmpty({
  scope,
  onExpand,
}: {
  scope: ScopeKey;
  onExpand: () => void;
}) {
  const label =
    scope === 'city'
      ? 'tu ciudad'
      : scope === 'province'
        ? 'tu provincia'
        : scope === 'country'
          ? 'tu país'
          : 'el ranking global';

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <p className="text-3xl">🎾</p>
      <p className="mt-3 text-sm font-semibold text-slate-800">
        No hay rivales en {label} por ahora
      </p>
      <p className="mt-1 text-xs text-slate-400">Ampliá el alcance para ver más jugadores.</p>
      {scope !== 'all' && (
        <button
          type="button"
          onClick={onExpand}
          className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
        >
          Ampliar búsqueda
        </button>
      )}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function DiscoverError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-6 text-center">
      <p className="text-sm font-semibold text-rose-800">No pudimos cargar los rivales</p>
      <p className="mt-0.5 text-xs text-rose-600">Revisá tu conexión y reintentá.</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={onRetry}
      >
        Reintentar
      </Button>
    </div>
  );
}
