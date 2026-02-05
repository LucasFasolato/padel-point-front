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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="h-44 w-full animate-pulse bg-slate-100" />
      <div className="p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="mt-6 h-10 w-full animate-pulse rounded-xl bg-slate-100" />
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
        e?.response?.data?.message ||
        e?.message ||
        'No pudimos cargar los clubes.';
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
        e?.response?.data?.message ||
        e?.message ||
        'No pudimos buscar clubes.';
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
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">PadelPoint</span>
          </div>
          <div className="flex items-center gap-4">
            {token && user?.role === 'USER' ? (
              <Link href="/me/reservations" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Mis reservas
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Iniciar sesión
              </Link>
            )}
            <Link href="/admin/login" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Soy Dueño
            </Link>
            <Link href="/admin/login" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-600">
              Ingresar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-500 blur-3xl mix-blend-multiply filter" />
          <div className="absolute top-24 -right-24 h-96 w-96 rounded-full bg-purple-500 blur-3xl mix-blend-multiply filter" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
            Tu cancha, <span className="text-blue-400">al toque.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300 mb-10">
            Encontrá y reservá canchas de pádel en tu ciudad en segundos. Sin llamadas, sin esperas.
          </p>

          <form onSubmit={onSubmit} className="mx-auto max-w-2xl relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-6 w-6 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, club o ciudad..."
                className="h-14 w-full rounded-full border-0 bg-white pl-12 pr-32 text-slate-900 shadow-xl ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 rounded-full bg-blue-600 px-6 font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
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
              className="mt-4 text-sm text-slate-300 hover:text-white underline underline-offset-4"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isSearching ? `Resultados para "${query.trim()}"` : 'Clubes Destacados'}
          </h2>
          {loading && hasLoaded && <Loader2 className="animate-spin text-blue-600" />}
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
          <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-slate-300">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">
              No pudimos {isSearching ? 'buscar' : 'cargar'} los clubes
            </h3>
            <p className="text-slate-500 mt-1 max-w-xl mx-auto">{error}</p>
            <button
              onClick={() => (isSearching ? handleSearch(query.trim()) : loadFeatured())}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
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
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <MapPin className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">
              {isSearching ? 'No encontramos clubes' : 'Todavía no hay clubes para mostrar'}
            </h3>
            <p className="text-slate-500">
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
