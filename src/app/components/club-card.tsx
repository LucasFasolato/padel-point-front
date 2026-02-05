'use client';

import Link from 'next/link';
import { MapPin, ArrowRight, Star } from 'lucide-react';
import { Club } from '@/types';

interface Props {
  club: Club;
}

export default function ClubCard({ club }: Props) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl">
      {/* Imagen (Placeholder por ahora) */}
      <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
        {/* Aquí iría: <img src={club.imagen} ... /> */}
        <div className="absolute bottom-0 left-0 p-4 z-20 text-white">
            <h3 className="text-xl font-bold leading-tight">{club.nombre}</h3>
            <div className="mt-1 flex items-center gap-1 text-xs font-medium opacity-90">
                <MapPin size={12} />
                <span>{club.direccion}</span>
            </div>
        </div>
        
        {/* Badge de "Popular" (Fake para diseño) */}
        <div className="absolute top-3 right-3 z-20 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-slate-900 shadow-sm flex items-center gap-1">
            <Star size={10} className="fill-yellow-400 text-yellow-400"/> 4.8
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-4 flex gap-2">
            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                Padel
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                Bar
            </span>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100">
            <Link 
                href={`/club/${club.id}`} 
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-600"
            >
                Reservar Ahora <ArrowRight size={16} />
            </Link>
        </div>
      </div>
    </div>
  );
}