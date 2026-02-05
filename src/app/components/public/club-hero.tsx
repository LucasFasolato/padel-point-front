'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Club, PublicMedia } from '@/types';
import { MapPin, Share2, Star, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClubHeroProps {
  club: Club;
  cover?: PublicMedia | null;
  logo?: PublicMedia | null;
}

export function ClubHero({ club, cover, logo }: ClubHeroProps) {
  const [copied, setCopied] = useState(false);

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
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Silencioso
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-slate-900">
      {/* Background Cover with Parallax-like effect */}
      <div className="absolute inset-0">
        {cover ? (
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            src={cover.secureUrl}
            alt=""
            className="h-full w-full object-cover opacity-50"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950" />
        )}
        
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 via-transparent to-slate-900/40" />
        
        {/* Subtle noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-md px-4 pb-8 pt-20 sm:max-w-3xl sm:px-6 sm:pt-24">
        <div className="flex items-end gap-4 sm:gap-5">
          {/* Logo Avatar */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative -mb-12 shrink-0 sm:-mb-14"
          >
            {/* Glow effect behind logo */}
            <div className="absolute -inset-2 rounded-3xl bg-blue-500/20 blur-xl" />
            
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-2xl shadow-black/30 sm:h-28 sm:w-28">
              {logo ? (
                <img
                  src={logo.secureUrl}
                  alt={`Logo ${club.nombre ?? ''}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <span className="text-3xl font-bold text-slate-400 sm:text-4xl">
                    {club.nombre ? club.nombre[0].toUpperCase() : 'C'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="min-w-0 flex-1 pb-1"
          >
            <h1 className="truncate text-xl font-bold text-white sm:text-2xl md:text-3xl">
              {club.nombre || 'Club Sin Nombre'}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Address */}
              <span className="flex items-center gap-1.5 text-sm text-slate-300">
                <MapPin size={14} className="shrink-0 text-blue-400" />
                <span className="truncate">{club.direccion || 'Sin dirección'}</span>
              </span>

              {/* Rating */}
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                <span>4.9</span>
              </span>
            </div>

            {/* Action buttons row */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {mapsUrl && (
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <ExternalLink size={12} />
                  Cómo llegar
                </motion.a>
              )}
            </div>
          </motion.div>

          {/* Share Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-1 shrink-0"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-all',
                copied
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
              aria-label="Compartir club"
              type="button"
            >
              {copied ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Check size={18} />
                </motion.div>
              ) : (
                <Share2 size={18} />
              )}
            </motion.button>
            
            {/* Copied tooltip */}
            {copied && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-white"
              >
                ¡Copiado!
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade for seamless transition */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-slate-50 to-transparent" />
    </div>
  );
}