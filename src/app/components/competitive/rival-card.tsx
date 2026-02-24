'use client';

import { MapPin, TrendingUp } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import type { RivalItem } from '@/services/competitive-service';

interface RivalCardProps {
  rival: RivalItem;
  onChallenge: (rival: RivalItem) => void;
  sending?: boolean;
  sent?: boolean;
  error?: string | null;
  /** Label for the primary CTA button. Defaults to "Desafiar". */
  ctaLabel?: string;
  /** Label shown after the CTA has been triggered. Defaults to "Enviado". */
  ctaSentLabel?: string;
}

function formatMomentum(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function getLocationLabel(rival: RivalItem): string | null {
  const city = rival.location?.city?.trim();
  const province = rival.location?.province?.trim();
  const country = rival.location?.country?.trim();

  const parts = [city, province].filter(Boolean) as string[];
  if (parts.length > 0) return parts.join(', ');
  return country || null;
}

export function RivalCard({
  rival,
  onChallenge,
  sending = false,
  sent = false,
  error,
  ctaLabel = 'Desafiar',
  ctaSentLabel = 'Enviado',
}: RivalCardProps) {
  const visibleTags = rival.tags.slice(0, 3);
  const hiddenTagsCount = Math.max(0, rival.tags.length - visibleTags.length);
  const locationLabel = getLocationLabel(rival);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">{rival.displayName}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
              Cat {rival.category}
            </span>
            <span className="font-medium text-slate-800">ELO {rival.elo}</span>
          </div>
        </div>

        <Button
          type="button"
          size="md"
          className="shrink-0 min-w-[110px]"
          onClick={() => onChallenge(rival)}
          disabled={sent}
          loading={sending}
        >
          {sent ? ctaSentLabel : ctaLabel}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <span>Actividad 30d: {rival.matches30d}</span>
        <span className="inline-flex items-center gap-1">
          <TrendingUp size={12} />
          Momentum: {formatMomentum(rival.momentum30d)}
        </span>
      </div>

      {locationLabel ? (
        <div className="mt-2 inline-flex max-w-full items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{locationLabel}</span>
        </div>
      ) : null}

      {rival.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700"
            >
              {tag}
            </span>
          ))}
          {hiddenTagsCount > 0 ? (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
              +{hiddenTagsCount}
            </span>
          ) : null}
        </div>
      ) : null}

      {rival.reasons.length > 0 ? (
        <p className="mt-3 text-xs text-slate-500">{rival.reasons.join(' · ')}</p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export default RivalCard;
