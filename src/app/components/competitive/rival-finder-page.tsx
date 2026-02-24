'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { RivalCard } from '@/app/components/competitive/rival-card';
import { useRivalSuggestions, type RivalSuggestionFilters } from '@/hooks/use-rival-suggestions';
import { useCreateDirectChallenge } from '@/hooks/use-challenges';
import type { RivalItem } from '@/services/competitive-service';

const DEFAULT_FILTERS: RivalSuggestionFilters = {
  limit: 20,
  range: 100,
  sameCategory: true,
};

type RivalFinderQueryState = {
  range: number;
  sameCategory: boolean;
  city: string;
  province: string;
  country: string;
};

function buildFilters(state: RivalFinderQueryState): RivalSuggestionFilters {
  return {
    ...DEFAULT_FILTERS,
    range: state.range,
    sameCategory: state.sameCategory,
    city: state.city.trim() || undefined,
    province: state.province.trim() || undefined,
    country: state.country.trim() || undefined,
  };
}

function createDefaultQueryState(): RivalFinderQueryState {
  return {
    range: DEFAULT_FILTERS.range ?? 100,
    sameCategory: DEFAULT_FILTERS.sameCategory ?? true,
    city: '',
    province: '',
    country: '',
  };
}

function RivalFinderSkeletonList() {
  return (
    <div className="space-y-3" data-testid="rival-finder-loading">
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
  const createDirectChallenge = useCreateDirectChallenge();

  const [draftFilters, setDraftFilters] = useState<RivalFinderQueryState>(createDefaultQueryState);
  const [appliedFilters, setAppliedFilters] = useState<RivalSuggestionFilters>(DEFAULT_FILTERS);
  const [sentUserIds, setSentUserIds] = useState<string[]>([]);
  const [sendingUserIds, setSendingUserIds] = useState<string[]>([]);
  const [cardErrors, setCardErrors] = useState<Record<string, string | undefined>>({});

  const rivalsQuery = useRivalSuggestions(appliedFilters);
  const rivals = rivalsQuery.data?.items ?? [];

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if ((appliedFilters.range ?? DEFAULT_FILTERS.range) !== DEFAULT_FILTERS.range) count += 1;
    if ((appliedFilters.sameCategory ?? DEFAULT_FILTERS.sameCategory) !== DEFAULT_FILTERS.sameCategory) count += 1;
    if (appliedFilters.city) count += 1;
    if (appliedFilters.province) count += 1;
    if (appliedFilters.country) count += 1;
    return count;
  }, [appliedFilters]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/competitive');
  };

  const applyFilters = () => {
    setAppliedFilters(buildFilters(draftFilters));
  };

  const resetFilters = () => {
    const nextState = createDefaultQueryState();
    setDraftFilters(nextState);
    setAppliedFilters(buildFilters(nextState));
  };

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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
          <h1 className="text-base font-bold text-slate-900 sm:text-lg">Buscar rival</h1>
          <div className="w-[84px]" />
        </div>

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
                {[50, 100, 150, 250].map((value) => (
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
                onChange={(e) => setDraftFilters((prev) => ({ ...prev, country: e.target.value }))}
                placeholder="Ej: Argentina"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
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

        <div className="mt-4 space-y-3">
          {rivalsQuery.isLoading ? (
            <RivalFinderSkeletonList />
          ) : rivalsQuery.isError ? (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <h2 className="text-sm font-semibold text-rose-900">No pudimos cargar sugerencias</h2>
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
              <h2 className="text-base font-semibold text-slate-900">No encontramos rivales todavía</h2>
              <p className="mt-2 text-sm text-slate-600">
                Ajustá filtros o volvé más tarde para nuevas sugerencias.
              </p>
              <ul className="mt-3 space-y-1 text-left text-sm text-slate-600">
                <li>Jugá más partidos para mejorar sugerencias</li>
                <li>Desactivá “misma categoría”</li>
              </ul>
            </section>
          ) : (
            <>
              {rivals.map((rival) => (
                <RivalCard
                  key={rival.userId}
                  rival={rival}
                  onChallenge={handleChallenge}
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
        </div>
      </div>
    </div>
  );
}

export default RivalFinderPage;
