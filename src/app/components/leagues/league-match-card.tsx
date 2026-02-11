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
  onClick: (match: LeagueMatch) => void;
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

export function LeagueMatchCard({ match, onClick }: LeagueMatchCardProps) {
  const statusColors = getMatchStatusColors(match.status);
  const sourceColors = getMatchSourceColors(match.source);
  const sourceLabel = getMatchSourceLabel(match.source);
  const teamANames = match.teamA.map((p) => p.displayName).join(' / ');
  const teamBNames = match.teamB.map((p) => p.displayName).join(' / ');

  return (
    <button
      type="button"
      onClick={() => onClick(match)}
      className={cn(
        'flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors',
        'hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1'
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar size={12} />
          {formatMatchDate(match.playedAt)}
        </span>
        <div className="flex items-center gap-1.5">
          {sourceLabel && (
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
        {match.score && (
          <span className="shrink-0 text-lg font-bold text-slate-800">
            {match.score}
          </span>
        )}
      </div>
    </button>
  );
}
