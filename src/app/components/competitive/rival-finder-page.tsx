'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronRight, Search, SlidersHorizontal, Users, Swords } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { RivalCard } from '@/app/components/competitive/rival-card';
import { useRivalSuggestions, type RivalSuggestionFilters } from '@/hooks/use-rival-suggestions';
import { usePartnerSuggestions } from '@/hooks/use-partner-suggestions';
import { useCreateDirectChallenge } from '@/hooks/use-challenges';
import { useFavorites, useToggleFavorite } from '@/hooks/use-favorites';
import {
  parseRivalFinderParams,
  buildSearchParams,
  RIVAL_FINDER_DEFAULTS,
  RIVAL_FINDER_RANGES,
  type RivalFinderParamState,
} from '@/lib/rival-finder-params';
import type { RivalItem } from '@/services/competitive-service';
import type { paths } from '@/api/schema';

const LIMIT = 20;
type ActiveTab = 'rivals' | 'partners';

function buildFilters(state: RivalFinderParamState): RivalSuggestionFilters {
  return {
    limit: LIMIT,
    range: state.range,
    sameCategory: state.sameCategory,
    city: state.city.trim() || undefined,
    province: state.province.trim() || undefined,
    country: state.country.trim() || undefined,
  };
}

function buildOptimisticFavoriteItem(
  rival: RivalItem,
): paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']['items'][number] {
  return {
    userId: rival.userId,
    displayName: rival.displayName,
    avatarUrl: rival.avatarUrl,
    category: rival.category,
    elo: rival.elo,
    location: rival.location
      ? {
          city: rival.location.city ?? undefined,
          province: rival.location.province ?? undefined,
          country: rival.location.country ?? undefined,
        }
      : null,
    createdAt: new Date().toISOString(),
  };
}

function MatchmakingSkeletonList({ testId }: { testId: string }) {
  return (
    <div className="space-y-3" data-testid={testId}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function RivalFinderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createDirectChallenge = useCreateDirectChallenge();
  const favoritesQuery = useFavorites({ limit: 100 });
  const toggleFavorite = useToggleFavorite();

  const activeTab: ActiveTab =
    searchParams.get('tab') === 'partners' ? 'partners' : 'rivals';

  // Source of truth: URL search params → applied filters
  const appliedParams = useMemo(() => parseRivalFinderParams(searchParams), [searchParams]);

  // Draft state for the filter form (initialized from URL)
  const [draftFilters, setDraftFilters] = useState<RivalFinderParamState>(() =>
    parseRivalFinderParams(searchParams),
  );

  // Sync draft when URL changes externally (Back/Forward navigation)
  useEffect(() => {
    setDraftFilters(parseRivalFinderParams(searchParams));
  }, [searchParams]);

  // Collapsible location section: open by default if URL has location params
  const [showLocation, setShowLocation] = useState(() => {
    const p = parseRivalFinderParams(searchParams);
    return !!(p.city || p.province || p.country);
  });

  // Rival-specific interaction state
  const [sentUserIds, setSentUserIds] = useState<string[]>([]);
  const [sendingUserIds, setSendingUserIds] = useState<string[]>([]);
  const [cardErrors, setCardErrors] = useState<Record<string, string | undefined>>({});

  // Only fetch the active tab to avoid double API calls
  const rivalsQuery = useRivalSuggestions(buildFilters(appliedParams), {
    enabled: activeTab === 'rivals',
  });
  const rivals = rivalsQuery.data?.items ?? [];

  const partnersQuery = usePartnerSuggestions(buildFilters(appliedParams), {
    enabled: activeTab === 'partners',
  });
  const partners = partnersQuery.data?.items ?? [];

  const favoritedUserIds = useMemo(
    () =>
      new Set(
        (favoritesQuery.data?.pages ?? [])
          .flatMap((page) => page.items)
          .map((favorite) => favorite.userId),
      ),
    [favoritesQuery.data],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedParams.range !== RIVAL_FINDER_DEFAULTS.range) count += 1;
    if (appliedParams.sameCategory !== RIVAL_FINDER_DEFAULTS.sameCategory) count += 1;
    if (appliedParams.city) count += 1;
    if (appliedParams.province) count += 1;
    if (appliedParams.country) count += 1;
    return count;
  }, [appliedParams]);

  const pushFilters = useCallback(
    (params: RivalFinderParamState, tab: ActiveTab = activeTab) => {
      const sp = buildSearchParams(params);
      if (tab === 'partners') sp.set('tab', 'partners');
      const query = sp.toString();
      router.push(`/competitive/find${query ? `?${query}` : ''}`);
    },
    [router, activeTab],
  );

  const setTab = useCallback(
    (tab: ActiveTab) => {
      pushFilters(appliedParams, tab);
    },
    [appliedParams, pushFilters],
  );

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/competitive');
  };

  const applyFilters = () => {
    pushFilters(draftFilters);
  };

  const resetFilters = () => {
    setDraftFilters({ ...RIVAL_FINDER_DEFAULTS });
    setShowLocation(false);
    // Keep the active tab when resetting filters
    const sp = new URLSearchParams();
    if (activeTab === 'partners') sp.set('tab', 'partners');
    const query = sp.toString();
    router.push(`/competitive/find${query ? `?${query}` : ''}`);
  };

  // One-tap fix: patch applied params and push to URL, keeping draft in sync
  const applyQuickFix = useCallback(
    (patch: Partial<RivalFinderParamState>) => {
      const next: RivalFinderParamState = { ...appliedParams, ...patch };
      setDraftFilters(next);
      pushFilters(next);
    },
    [appliedParams, pushFilters],
  );

  // Rival CTA: send a direct challenge
  const handleChallenge = async (rival: RivalItem) => {
    setCardErrors((prev) => ({ ...prev, [rival.userId]: undefined }));
    setSendingUserIds((prev) => (prev.includes(rival.userId) ? prev : [...prev, rival.userId]));
    setSentUserIds((prev) => (prev.includes(rival.userId) ? prev : [...prev, rival.userId]));

    try {
      await createDirectChallenge.mutateAsync({ opponentUserId: rival.userId });
    } catch {
      setSentUserIds((prev) => prev.filter((id) => id !== rival.userId));
      setCardErrors((prev) => ({
        ...prev,
        [rival.userId]: 'No se pudo enviar el desafío. Reintentá.',
      }));
    } finally {
      setSendingUserIds((prev) => prev.filter((id) => id !== rival.userId));
    }
  };

  // Partner CTA: navigate to challenge creation with partner pre-filled
  const handleInvitePartner = useCallback(
    (partner: RivalItem) => {
      router.push(
        `/competitive/challenges/new?partnerUserId=${encodeURIComponent(partner.userId)}`,
      );
    },
    [router],
  );

  const handleToggleFavorite = useCallback(
    (rival: RivalItem) => {
      toggleFavorite.mutate({
        targetUserId: rival.userId,
        isFavorited: favoritedUserIds.has(rival.userId),
        optimisticItem: buildOptimisticFavoriteItem(rival),
      });
    },
    [favoritedUserIds, toggleFavorite],
  );

  // Compute actionable empty state suggestions (shared by both tabs)
  const buildEmptyStateSuggestions = useCallback(
    (isLoading: boolean, isError: boolean, itemCount: number) => {
      if (itemCount > 0 || isLoading || isError) return [];

      const suggestions: Array<{ label: string; testId: string; action: () => void }> = [];

      if (appliedParams.sameCategory) {
        suggestions.push({
          label: 'Desactivar "misma categoría"',
          testId: 'empty-disable-same-category',
          action: () => applyQuickFix({ sameCategory: false }),
        });
      }

      const nextRange =
        appliedParams.range === 50
          ? 100
          : appliedParams.range === 100
            ? 150
            : appliedParams.range === 150
              ? 200
              : null;

      if (nextRange !== null) {
        suggestions.push({
          label: `Ampliar rango a ±${nextRange}`,
          testId: 'empty-increase-range',
          action: () => applyQuickFix({ range: nextRange }),
        });
      }

      if (appliedParams.city || appliedParams.province || appliedParams.country) {
        suggestions.push({
          label: 'Limpiar ubicación',
          testId: 'empty-clear-location',
          action: () => applyQuickFix({ city: '', province: '', country: '' }),
        });
      }

      return suggestions;
    },
    [appliedParams, applyQuickFix],
  );

  const rivalEmptySuggestions = useMemo(
    () =>
      buildEmptyStateSuggestions(
        rivalsQuery.isLoading,
        rivalsQuery.isError,
        rivalsQuery.data?.items.length ?? 0,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rivalsQuery.data, rivalsQuery.isLoading, rivalsQuery.isError, buildEmptyStateSuggestions],
  );

  const partnerEmptySuggestions = useMemo(
    () =>
      buildEmptyStateSuggestions(
        partnersQuery.isLoading,
        partnersQuery.isError,
        partnersQuery.data?.items.length ?? 0,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [partnersQuery.data, partnersQuery.isLoading, partnersQuery.isError, buildEmptyStateSuggestions],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
          <h1 className="text-base font-bold text-slate-900 sm:text-lg">Buscar jugadores</h1>
          <div className="w-[84px]" />
        </div>

        {/* Tab switcher */}
        <div
          className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rivals'}
            data-testid="tab-rivals"
            onClick={() => setTab('rivals')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'rivals'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Swords size={14} />
            Rivales
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'partners'}
            data-testid="tab-partners"
            onClick={() => setTab('partners')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'partners'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={14} />
            Compañeros
          </button>
        </div>

        {/* Shared filter panel */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900">Filtros</h2>
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {activeFilterCount}
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-slate-700">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Rango ELO
              </span>
              <select
                value={draftFilters.range}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, range: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {RIVAL_FINDER_RANGES.map((value) => (
                  <option key={value} value={value}>
                    ±{value}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={draftFilters.sameCategory}
                onChange={(e) =>
                  setDraftFilters((prev) => ({ ...prev, sameCategory: e.target.checked }))
                }
              />
              Misma categoría
            </label>
          </div>

          {/* Collapsible location section */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowLocation((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
              aria-expanded={showLocation}
            >
              {showLocation ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Ubicación
              {(draftFilters.city || draftFilters.province || draftFilters.country) && (
                <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">
                  activa
                </span>
              )}
            </button>

            {showLocation && (
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-700">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Ciudad
                  </span>
                  <input
                    type="text"
                    value={draftFilters.city}
                    onChange={(e) => setDraftFilters((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Ej: Córdoba"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-sm text-slate-700">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Provincia
                  </span>
                  <input
                    type="text"
                    value={draftFilters.province}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({ ...prev, province: e.target.value }))
                    }
                    placeholder="Ej: Córdoba"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-sm text-slate-700 sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    País
                  </span>
                  <input
                    type="text"
                    value={draftFilters.country}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({ ...prev, country: e.target.value }))
                    }
                    placeholder="Ej: Argentina"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={applyFilters}>
              <Search size={14} />
              Aplicar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </div>
        </section>

        {/* Results */}
        <div className="mt-4 space-y-3">
          {/* ── Rivals tab ── */}
          {activeTab === 'rivals' && (
            <>
              {rivalsQuery.isLoading ? (
                <MatchmakingSkeletonList testId="rival-finder-loading" />
              ) : rivalsQuery.isError ? (
                <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <h2 className="text-sm font-semibold text-rose-900">
                    No pudimos cargar sugerencias
                  </h2>
                  <p className="mt-1 text-sm text-rose-700">
                    Reintentá en unos segundos para volver a buscar rivales.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => rivalsQuery.refetch()}
                  >
                    Reintentar
                  </Button>
                </section>
              ) : rivals.length === 0 ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <h2 className="text-base font-semibold text-slate-900">
                    No encontramos rivales todavía
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Ajustá los filtros para ampliar la búsqueda.
                  </p>
                  {rivalEmptySuggestions.length > 0 ? (
                    <div className="mt-4 flex flex-col gap-2">
                      {rivalEmptySuggestions.map((s) => (
                        <Button
                          key={s.testId}
                          type="button"
                          size="sm"
                          variant="outline"
                          data-testid={s.testId}
                          onClick={s.action}
                        >
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-1 text-left text-sm text-slate-600">
                      <li>Jugá más partidos para mejorar sugerencias</li>
                    </ul>
                  )}
                </section>
              ) : (
                <>
                  {rivals.map((rival) => (
                    <RivalCard
                      key={rival.userId}
                      rival={rival}
                      onChallenge={handleChallenge}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorited={favoritedUserIds.has(rival.userId)}
                      favoriteLoading={
                        toggleFavorite.isPending &&
                        toggleFavorite.variables?.targetUserId === rival.userId
                      }
                      sent={sentUserIds.includes(rival.userId)}
                      sending={sendingUserIds.includes(rival.userId)}
                      error={cardErrors[rival.userId] ?? null}
                    />
                  ))}
                  {rivalsQuery.hasNextPage ? (
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      onClick={() => rivalsQuery.fetchNextPage()}
                      loading={rivalsQuery.isFetchingNextPage}
                    >
                      {rivalsQuery.isFetchingNextPage ? 'Cargando...' : 'Cargar más sugerencias'}
                    </Button>
                  ) : null}
                </>
              )}
            </>
          )}

          {/* ── Partners tab ── */}
          {activeTab === 'partners' && (
            <>
              {partnersQuery.isLoading ? (
                <MatchmakingSkeletonList testId="partner-finder-loading" />
              ) : partnersQuery.isError ? (
                <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <h2 className="text-sm font-semibold text-rose-900">
                    No pudimos cargar sugerencias
                  </h2>
                  <p className="mt-1 text-sm text-rose-700">
                    Reintentá en unos segundos para volver a buscar compañeros.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => partnersQuery.refetch()}
                  >
                    Reintentar
                  </Button>
                </section>
              ) : partners.length === 0 ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <h2 className="text-base font-semibold text-slate-900">
                    No encontramos compañeros todavía
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Ajustá los filtros para ampliar la búsqueda.
                  </p>
                  {partnerEmptySuggestions.length > 0 ? (
                    <div className="mt-4 flex flex-col gap-2">
                      {partnerEmptySuggestions.map((s) => (
                        <Button
                          key={s.testId}
                          type="button"
                          size="sm"
                          variant="outline"
                          data-testid={s.testId}
                          onClick={s.action}
                        >
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-1 text-left text-sm text-slate-600">
                      <li>Jugá más partidos para mejorar sugerencias</li>
                    </ul>
                  )}
                </section>
              ) : (
                <>
                  {partners.map((partner) => (
                    <RivalCard
                      key={partner.userId}
                      rival={partner}
                      onChallenge={handleInvitePartner}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorited={favoritedUserIds.has(partner.userId)}
                      favoriteLoading={
                        toggleFavorite.isPending &&
                        toggleFavorite.variables?.targetUserId === partner.userId
                      }
                      ctaLabel="Invitar"
                      ctaSentLabel="Invitado"
                      sent={false}
                      sending={false}
                    />
                  ))}
                  {partnersQuery.hasNextPage ? (
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      onClick={() => partnersQuery.fetchNextPage()}
                      loading={partnersQuery.isFetchingNextPage}
                    >
                      {partnersQuery.isFetchingNextPage
                        ? 'Cargando...'
                        : 'Cargar más compañeros'}
                    </Button>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RivalFinderPage;
