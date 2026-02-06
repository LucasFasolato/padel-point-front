import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MatchView } from '@/types/competitive';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: MatchView;
  variant?: 'compact' | 'detailed';
  onClick?: () => void;
  className?: string;
}

export function MatchCard({ 
  match, 
  variant = 'compact', 
  onClick, 
  className 
}: MatchCardProps) {
  const statusIcon = match.isWin ? '✅' : '❌';
  const statusText = match.isWin ? 'Victoria' : 'Derrota';
  const statusColor = match.isWin ? 'text-green-600' : 'text-red-600';
  const isPending = match.status === 'pending_confirm';

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-4 transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300',
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{statusIcon}</span>
          <span className={cn('font-semibold', statusColor)}>{statusText}</span>
          {isPending && (
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              Pendiente
            </span>
          )}
        </div>
        {match.eloChange !== null && (
          <div className={cn(
            'text-sm font-semibold',
            match.eloChange > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {match.eloChange > 0 ? '+' : ''}{match.eloChange} ELO
          </div>
        )}
      </div>

      {/* Opponent */}
      <div className="mb-2">
        <div className="font-medium text-slate-900">
          vs. {match.opponent.displayName}
        </div>
        {match.partner && (
          <div className="text-sm text-slate-600">
            Con {match.partner.displayName}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="mb-2 font-mono text-sm font-semibold text-slate-700">
        {match.score}
      </div>

      {/* Footer */}
      <div className="text-xs text-slate-500">
        {formatDistanceToNow(new Date(match.playedAt), { 
          addSuffix: true, 
          locale: es 
        })}
      </div>
    </div>
  );
}