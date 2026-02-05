'use client';

import React, { useEffect, useState } from 'react';
import { Search, MapPin, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toastManager } from '@/lib/toast';
import { useAuthStore } from '@/store/auth-store';

import { Club } from '@/types';
import ClubCard from '@/app/components/club-card';
import { PlayerService } from '@/services/player-service';

function ClubCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
      <div className="h-44 w-full animate-pulse bg-surface2" />
      <div className="p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-surface2" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-surface2" />
        <div className="mt-6 h-10 w-full animate-pulse rounded-xl bg-surface2" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { token, user } = useAuthStore();

  const loadFeatured = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PlayerService.listClubs();
      setClubs(data ?? []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || 'No pudimos cargar los clubes.';
      setError(msg);
      setClubs([]);
      toastManager.error('No pudimos cargar los clubes', {
        idempotencyKey: 'clubs-load-error',
      });
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatured();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await PlayerService.searchClubs(searchTerm);
      setClubs(data ?? []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || 'No pudimos buscar clubes.';
      setError(msg);
      setClubs([]);
      toastManager.error('No pudimos buscar clubes', {
        idempotencyKey: 'clubs-search-error',
      });
    } finally {
      setHasLoaded(true);
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query.trim());
  };

  const isSearching = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-text">
              PadelPoint
            </span>
          </div>

          <div className="flex items-center gap-4">
            {token && user?.role === 'USER' ? (
              <Link
                href="/me/reservations"
                className="text-sm font-medium text-textMuted hover:text-text"
              >
                Mis reservas
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-textMuted hover:text-text"
              >
                Iniciar sesión
              </Link>
            )}

            <Link
              href="/admin/login"
              className="text-sm font-medium text-textMuted hover:text-text"
            >
              Soy Dueño
            </Link>

            <Link
              href="/admin/login"
              className="rounded-full bg-brand-950 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
            >
              Ingresar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-brand-950 py-24 sm:py-32">
        {/* blobs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary blur-3xl mix-blend-multiply filter" />
          <div className="absolute top-24 -right-24 h-96 w-96 rounded-full bg-primary-300 blur-3xl mix-blend-multiply filter" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Tu cancha, <span className="text-primary-300">al toque.</span>
          </h1>

          <p className="mx-auto mb-10 mt-6 max-w-2xl text-lg leading-8 text-white/75">
            Encontrá y reservá canchas de pádel en tu ciudad en segundos. Sin llamadas, sin esperas.
          </p>

          <form onSubmit={onSubmit} className="mx-auto max-w-2xl relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-6 w-6 text-white/45" />

              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, club o ciudad..."
                className="h-14 w-full rounded-full border-0 bg-white/95 pl-12 pr-32 text-slate-900 shadow-xl ring-1 ring-inset ring-black/10 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-lg"
              />

              <button
                type="submit"
                disabled={loading}
                className="absolute bottom-2 right-2 top-2 flex items-center gap-2 rounded-full bg-primary px-6 font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando
                  </>
                ) : (
                  'Buscar'
                )}
              </button>
            </div>
          </form>

          {isSearching && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                loadFeatured();
              }}
              className="mt-4 text-sm text-white/70 hover:text-white underline underline-offset-4"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-text">
            {isSearching ? `Resultados para "${query.trim()}"` : 'Clubes Destacados'}
          </h2>

          {loading && hasLoaded && <Loader2 className="animate-spin text-primary" />}
        </div>

        {/* First-load skeletons */}
        {loading && !hasLoaded && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <ClubCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-3xl bg-surface py-14 text-center ring-1 ring-dashed ring-border">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-warning" />
            <h3 className="text-lg font-medium text-text">
              No pudimos {isSearching ? 'buscar' : 'cargar'} los clubes
            </h3>
            <p className="mx-auto mt-1 max-w-xl text-textMuted">{error}</p>

            <button
              onClick={() => (isSearching ? handleSearch(query.trim()) : loadFeatured())}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-950 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
            >
              <RefreshCw size={16} />
              Reintentar
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && clubs.length > 0 && (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && hasLoaded && clubs.length === 0 && (
          <div className="rounded-3xl bg-surface py-20 text-center ring-1 ring-dashed ring-border">
            <MapPin className="mx-auto mb-4 h-12 w-12 text-textMuted/50" />
            <h3 className="text-lg font-medium text-text">
              {isSearching ? 'No encontramos clubes' : 'Todavía no hay clubes para mostrar'}
            </h3>
            <p className="mt-1 text-textMuted">
              {isSearching
                ? 'Probá buscando con otro nombre o en otra ciudad.'
                : 'Cuando haya clubes cargados, van a aparecer acá.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
