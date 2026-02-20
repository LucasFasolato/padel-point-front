'use client';

import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getMatchStatusLabel,
  getMatchStatusColors,
  getMatchSourceLabel,
  getMatchSourceColors,
} from '@/lib/league-utils';
import type { LeagueMatch } from '@/types/leagues';

interface LeagueMatchCardProps {
  match: LeagueMatch;
  onClick?: (match: LeagueMatch) => void;
  onLoadResult?: (match: LeagueMatch) => void;
}

function formatMatchDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function LeagueMatchCard({ match, onClick, onLoadResult }: LeagueMatchCardProps) {
  const statusColors = getMatchStatusColors(match.status);
  const sourceColors = getMatchSourceColors(match.source);
  const sourceLabel = getMatchSourceLabel(match.source);
  const teamANames = match.teamA.map((p) => p.displayName).join(' / ') || 'Equipo A';
  const teamBNames = match.teamB.map((p) => p.displayName).join(' / ') || 'Equipo B';
  const isScheduled = match.status === 'scheduled';
  const matchDate = match.playedAt || match.scheduledAt || '';
  const hasClickableCard = typeof onClick === 'function';

  return (
    <div
      role={hasClickableCard ? 'button' : undefined}
      tabIndex={hasClickableCard ? 0 : undefined}
      onClick={() => onClick?.(match)}
      onKeyDown={(e) => {
        if (!hasClickableCard) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(match);
        }
      }}
      className={cn(
        'flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors',
        'hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1'
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar size={12} />
          {matchDate ? formatMatchDate(matchDate) : 'Sin fecha'}
        </span>
        <div className="flex items-center gap-1.5">
          {sourceLabel && !isScheduled && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                sourceColors.bg,
                sourceColors.text
              )}
            >
              {sourceLabel}
            </span>
          )}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
              statusColors.bg,
              statusColors.text
            )}
          >
            {getMatchStatusLabel(match.status)}
          </span>
        </div>
      </div>

      {/* Teams & score */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">{teamANames}</p>
          <p className="text-xs text-slate-500">vs</p>
          <p className="text-sm font-semibold text-slate-900 truncate">{teamBNames}</p>
        </div>
        {match.score && !isScheduled && (
          <span className="shrink-0 text-lg font-bold text-slate-800">
            {match.score}
          </span>
        )}
      </div>

      {isScheduled && onLoadResult && (
        <div className="pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadResult(match);
            }}
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Cargar resultado
          </button>
        </div>
      )}
    </div>
  );
}
