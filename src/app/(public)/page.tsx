'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Club } from '@/types';
import { MapPin, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await api.get('/clubs');
        setClubs(res.data);
      } catch (error) {
        console.error("Error fetching clubs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <div className="bg-surface px-6 py-16 text-center text-text">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Encontrá tu cancha. <span className="text-primary">Jugá Ya.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-textMuted">
          La forma más simple de reservar canchas de pádel. Sin esperas, sin llamadas.
        </p>
      </div>

      {/* Club List */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">Clubes Disponibles</h2>
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm text-textMuted shadow-sm ring-1 ring-border">
            <Search size={16} />
            <span>Buscar club...</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-textMuted">Cargando clubes...</div>
        ) : clubs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-textMuted">
            No hay clubes activos en este momento.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Link
                key={club.id}
                href={`/club/${club.id}`}
                className="group relative overflow-hidden rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-border transition-all hover:shadow-lg hover:ring-ring"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <MapPin size={24} />
                </div>

                <h3 className="mb-1 text-lg font-bold text-text group-hover:text-primary">{club.nombre}</h3>
                <p className="mb-6 text-sm text-textMuted">{club.direccion}</p>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-textMuted">
                    Ver Canchas
                  </span>
                  <ArrowRight
                    size={18}
                    className="text-textMuted/60 transition-transform group-hover:translate-x-1 group-hover:text-primary"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
