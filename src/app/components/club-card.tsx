'use client';

import Link from 'next/link';
import { MapPin, ArrowRight, Star } from 'lucide-react';
import { Club } from '@/types';

interface Props {
  club: Club;
}

export default function ClubCard({ club }: Props) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-xl">
      {/* Imagen (Placeholder por ahora) */}
      <div className="relative h-48 w-full overflow-hidden bg-surface2">
        {/* overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />

        {/* Aquí iría: <img src={club.imagen} ... /> */}
        <div className="absolute bottom-0 left-0 z-20 p-4 text-white">
          <h3 className="text-xl font-bold leading-tight">{club.nombre}</h3>
          <div className="mt-1 flex items-center gap-1 text-xs font-medium opacity-90">
            <MapPin size={12} />
            <span>{club.direccion}</span>
          </div>
        </div>

        {/* Badge rating */}
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 text-xs font-bold text-text shadow-sm ring-1 ring-border backdrop-blur">
          <Star size={10} className="fill-warning text-warning" /> 4.8
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-4 flex gap-2">
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
            Padel
          </span>

          <span className="inline-flex items-center rounded-md bg-surface2 px-2 py-1 text-xs font-medium text-textMuted ring-1 ring-inset ring-border">
            Bar
          </span>
        </div>

        <div className="mt-auto border-t border-border pt-4">
          <Link
            href={`/club/${club.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
          >
            Reservar Ahora <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
