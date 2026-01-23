import type { Club, PublicMedia } from '@/types';
import { MapPin, Share2, Star } from 'lucide-react';

interface ClubHeroProps {
  club: Club;
  cover?: PublicMedia | null;
  logo?: PublicMedia | null;
}

export function ClubHero({ club, cover, logo }: ClubHeroProps) {
  const mapsUrl =
    club.latitud != null && club.longitud != null
      ? `https://www.google.com/maps?q=${club.latitud},${club.longitud}`
      : null;

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: club.nombre, url });
      } else {
        await navigator.clipboard.writeText(url);
        // Si querés: toast.success("Link copiado")
      }
    } catch {
      // Silencioso (mejor UX)
    }
  };

  return (
    <div className="relative w-full bg-slate-900 shadow-md group">
      {/* Background Cover */}
      <div className="absolute inset-0 overflow-hidden">
        {cover ? (
          <img
            src={cover.secureUrl}
            alt="Cover"
            className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-800 to-blue-900 opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative mx-auto max-w-md px-4 pt-24 pb-6 sm:max-w-3xl sm:px-6">
        <div className="flex items-end gap-5">
          {/* Logo Avatar (Floating) */}
          <div className="relative -mb-10 shrink-0">
            <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl sm:h-32 sm:w-32">
              {logo ? (
                <img
                  src={logo.secureUrl}
                  alt={`Logo ${club.nombre ?? ''}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-2xl font-bold text-slate-300">
                  {club.nombre ? club.nombre[0] : 'C'}
                </div>
              )}
            </div>
          </div>

          {/* Text Info */}
          <div className="flex-1 pb-1">
            <h1 className="text-2xl font-bold text-white shadow-sm sm:text-3xl">
              {club.nombre || 'Club Sin Nombre'}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-200">
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-blue-400" />
                {club.direccion || 'Sin dirección'}
              </span>

              <span className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400 fill-yellow-400" /> 4.9 (TrustPilot)
              </span>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md hover:bg-white/15"
                >
                  Cómo llegar
                </a>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleShare}
            className="mb-2 rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition-colors hover:bg-white/20"
            aria-label="Compartir club"
            type="button"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
