'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useCreateDirectChallenge } from '@/hooks/use-challenges';
import { useFavorites } from '@/hooks/use-favorites';

function getLocationLabel(location: {
  city?: string;
  province?: string;
  country?: string;
} | null): string | null {
  if (!location) return null;

  const city = location.city?.trim();
  const province = location.province?.trim();
  const country = location.country?.trim();
  const parts = [city, province].filter(Boolean) as string[];

  if (parts.length > 0) return parts.join(', ');
  return country || null;
}

function FavoritesSkeletonList() {
  return (
    <div className="space-y-3" data-testid="favorites-loading">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-11 w-28 rounded-xl" />
          </div>
          <Skeleton className="mt-3 h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const favoritesQuery = useFavorites({ limit: 20 });
  const createDirectChallenge = useCreateDirectChallenge();

  const [sentUserIds, setSentUserIds] = useState<string[]>([]);
  const [sendingUserIds, setSendingUserIds] = useState<string[]>([]);
  const [cardErrors, setCardErrors] = useState<Record<string, string | undefined>>({});

  const favorites = useMemo(
    () => (favoritesQuery.data?.pages ?? []).flatMap((page) => page.items),
    [favoritesQuery.data],
  );

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/players/me');
  };

  const handleChallenge = async (
    favorite: NonNullable<typeof favorites>[number],
  ) => {
    setCardErrors((prev) => ({ ...prev, [favorite.userId]: undefined }));
    setSendingUserIds((prev) =>
      prev.includes(favorite.userId) ? prev : [...prev, favorite.userId],
    );
    setSentUserIds((prev) => (prev.includes(favorite.userId) ? prev : [...prev, favorite.userId]));

    try {
      await createDirectChallenge.mutateAsync({ opponentUserId: favorite.userId });
    } catch {
      setSentUserIds((prev) => prev.filter((id) => id !== favorite.userId));
      setCardErrors((prev) => ({
        ...prev,
        [favorite.userId]: 'No se pudo enviar el desafío. Reintentá.',
      }));
    } finally {
      setSendingUserIds((prev) => prev.filter((id) => id !== favorite.userId));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Volver
          </button>
          <h1 className="text-base font-bold text-slate-900 sm:text-lg">Favoritos</h1>
          <div className="w-[84px]" />
        </div>

        {favoritesQuery.isLoading ? (
          <FavoritesSkeletonList />
        ) : favoritesQuery.isError ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <h2 className="text-sm font-semibold text-rose-900">No pudimos cargar favoritos</h2>
            <p className="mt-1 text-sm text-rose-700">
              Reintentá en unos segundos para volver a cargar la lista.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => favoritesQuery.refetch()}
            >
              Reintentar
            </Button>
          </section>
        ) : favorites.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Todavía no guardaste jugadores
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Guardá rivales o compañeros desde el buscador para verlos acá.
            </p>
            <Link
              href="/competitive/find"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Buscar rival
            </Link>
          </section>
        ) : (
          <div className="space-y-3">
            {favorites.map((favorite) => {
              const locationLabel = getLocationLabel(favorite.location);

              return (
                <article
                  key={favorite.userId}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="fill-current text-amber-500" />
                        <h2 className="truncate text-base font-semibold text-slate-900">
                          {favorite.displayName}
                        </h2>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          Cat {favorite.category}
                        </span>
                        <span className="font-medium text-slate-800">ELO {favorite.elo}</span>
                      </div>
                      {locationLabel ? (
                        <div className="mt-2 inline-flex max-w-full items-center gap-1 text-xs text-slate-500">
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate">{locationLabel}</span>
                        </div>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      size="md"
                      className="shrink-0 min-w-[110px]"
                      onClick={() => handleChallenge(favorite)}
                      disabled={sentUserIds.includes(favorite.userId)}
                      loading={sendingUserIds.includes(favorite.userId)}
                    >
                      {sentUserIds.includes(favorite.userId) ? 'Enviado' : 'Desafiar'}
                    </Button>
                  </div>

                  {cardErrors[favorite.userId] ? (
                    <p
                      role="alert"
                      className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                    >
                      {cardErrors[favorite.userId]}
                    </p>
                  ) : null}
                </article>
              );
            })}

            {favoritesQuery.hasNextPage ? (
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => favoritesQuery.fetchNextPage()}
                loading={favoritesQuery.isFetchingNextPage}
              >
                {favoritesQuery.isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
