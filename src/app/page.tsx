'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Club } from '@/types';
import ClubCard from '@/app/components/club-card';
import Link from 'next/link';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Búsqueda inicial (opcional: cargar destacados)
  useEffect(() => {
    handleSearch('');
  }, []);

  const handleSearch = async (searchTerm: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/clubs/search?q=${searchTerm}`);
      setClubs(res.data);
      setHasSearched(true);
    } catch (error) {
      console.error("Error buscando clubes", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Navbar Simple */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">P</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">PadelPoint</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              Soy Dueño
            </Link>
            <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-600">
              Ingresar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
        {/* Fondo decorativo */}
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
          
          {/* Barra de Búsqueda */}
          <form onSubmit={onSubmit} className="mx-auto max-w-2xl relative">
            <div className="relative flex items-center">
                <Search className="absolute left-4 h-6 w-6 text-slate-400" />
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre, club o ciudad..." 
                    className="h-14 w-full rounded-full border-0 bg-white pl-12 pr-4 text-slate-900 shadow-xl ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-lg"
                />
                <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 rounded-full bg-blue-600 px-6 font-bold text-white hover:bg-blue-500 transition-colors"
                >
                    Buscar
                </button>
            </div>
          </form>
        </div>
      </div>

      {/* Resultados */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {query ? `Resultados para "${query}"` : 'Clubes Destacados'}
            </h2>
            {loading && <Loader2 className="animate-spin text-blue-600" />}
        </div>

        {clubs.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
                {clubs.map((club) => (
                    <ClubCard key={club.id} club={club} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <MapPin className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No encontramos clubes</h3>
                <p className="text-slate-500">Prueba buscando con otro nombre o en otra ciudad.</p>
            </div>
        )}
      </div>
    </div>
  );
}