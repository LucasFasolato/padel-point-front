'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Skeleton } from '@/app/components/ui/skeleton';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import { cn } from '@/lib/utils';
import type { RankingEntry } from '@/types/competitive';
import type { RankingScope } from '@/types/rankings';
import { RankingShareModal } from './ranking-share-modal';

interface MyPositionCardProps {
  entry: RankingEntry | null;
  scope: RankingScope;
  cityName?: string | null;
  provinceName?: string | null;
  isLoading: boolean;
  matchesRequired?: number;
}

function getScopeLabel(
  scope: RankingScope,
  cityName?: string | null,
  provinceName?: string | null,
): string {
  if (scope === 'city') return cityName ?? 'tu ciudad';
  if (scope === 'province') return provinceName ?? 'tu provincia';
  return 'Argentina';
}

export function MyPositionCard({
  entry,
  scope,
  cityName,
  provinceName,
  isLoading,
  matchesRequired = 4,
}: MyPositionCardProps) {
  const [showShare, setShowShare] = useState(false);

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 w-full bg-slate-100" />
        <div className="flex items-start justify-between gap-4 px-5 py-5">
          <div className="space-y-2.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-14 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50">
        <div className="px-5 py-5 text-center">
          <p className="text-sm font-semibold text-slate-700">Todavía no estás en el ranking</p>
          <p className="mt-1 text-xs text-slate-500">
            Jugá al menos {matchesRequired} partidos competitivos para aparecer
          </p>
        </div>
      </div>
    );
  }

  const scopeLabel = getScopeLabel(scope, cityName, provinceName);
  const delta = entry.positionDelta;
  const hasDelta = typeof delta === 'number' && delta !== 0;
  const isUp = hasDelta && (delta ?? 0) > 0;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[#0E7C66]/20 bg-gradient-to-br from-[#0E7C66]/[0.06] via-white to-white shadow-sm">
        {/* Accent stripe */}
        <div className="h-1 bg-gradient-to-r from-[#0E7C66] to-emerald-400" />

        <div className="flex items-start justify-between gap-4 px-5 py-5">
          {/* Left: position hero */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#0E7C66]">
              Tu posición en {scopeLabel}
            </p>

            <div className="flex items-end gap-2.5">
              <span className="text-6xl font-extrabold leading-none tracking-tight text-slate-900">
                #{entry.position ?? '?'}
              </span>

              {hasDelta && (
                <span
                  className={cn(
                    'mb-1.5 text-sm font-bold',
                    isUp ? 'text-emerald-600' : 'text-rose-500',
                  )}
                >
                  {isUp ? '▲' : '▼'}&nbsp;{Math.abs(delta ?? 0)}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>{entry.matchesPlayed} PJ</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-emerald-600">{entry.wins}V</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-rose-500">{entry.losses}D</span>
            </div>
          </div>

          {/* Right: category + ELO + share */}
          <div className="flex flex-col items-end gap-1.5">
            <CategoryBadge category={entry.category} />
            <p className="text-3xl font-extrabold tracking-tight text-[#0E7C66]">{entry.elo}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">ELO</p>

            <button
              type="button"
              onClick={() => setShowShare(true)}
              aria-label="Compartir mi posición"
              className="mt-1 flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#0E7C66]/30 bg-[#0E7C66]/5 px-3 py-1.5 text-xs font-semibold text-[#0E7C66] transition-colors hover:bg-[#0E7C66]/10 active:bg-[#0E7C66]/15"
            >
              <Share2 className="h-3.5 w-3.5" />
              Compartir
            </button>
          </div>
        </div>
      </div>

      {/* Share modal — rendered outside the card flow */}
      <RankingShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        position={entry.position ?? 0}
        delta={delta ?? null}
        elo={entry.elo}
        scope={scope}
        category={entry.category}
        cityName={cityName}
        provinceName={provinceName}
      />
    </>
  );
}
