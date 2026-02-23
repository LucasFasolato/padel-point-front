import type { Ref } from 'react';
import type { RankingEntry } from '@/types/competitive';
import { cn } from '@/lib/utils';
import { CategoryBadge } from './category-badge';

interface RankingTableProps {
  players: RankingEntry[];
  currentUserId?: string;
  onChallenge?: (playerId: string) => void;
  myRowRef?: Ref<HTMLTableRowElement>;
  className?: string;
}

function PositionDelta({ delta }: { delta?: number | null }) {
  if (typeof delta !== 'number') return null;
  if (delta > 0) {
    return <span className="text-xs font-semibold text-emerald-600">{`\u25B2${delta}`}</span>;
  }
  if (delta < 0) {
    return <span className="text-xs font-semibold text-rose-600">{`\u25BC${Math.abs(delta)}`}</span>;
  }
  return <span className="text-xs font-semibold text-slate-500">-</span>;
}

export function RankingTable({
  players,
  currentUserId,
  onChallenge,
  myRowRef,
  className,
}: RankingTableProps) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Jugador</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Cat.</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">ELO</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">PJ</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">V/D</th>
              {onChallenge && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Accion</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {players.map((player, index) => {
              const isCurrentUser = player.userId === currentUserId;
              const position = player.position ?? index + 1;

              return (
                <tr
                  key={player.userId}
                  ref={isCurrentUser ? myRowRef : undefined}
                  data-current-user-row={isCurrentUser ? 'true' : undefined}
                  data-ranking-user-id={player.userId}
                  className={cn('transition-colors hover:bg-slate-50', isCurrentUser && 'bg-blue-50/70')}
                >
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className={cn(isCurrentUser && 'font-semibold')}>{position}</span>
                      <PositionDelta delta={player.positionDelta} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      {player.displayName}
                      {isCurrentUser && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          Vos
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CategoryBadge category={player.category} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">{player.elo}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">{player.matchesPlayed}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">
                    <span className="text-green-600">{player.wins}</span>
                    {' / '}
                    <span className="text-red-600">{player.losses}</span>
                  </td>
                  {onChallenge && !isCurrentUser && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onChallenge(player.userId)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        Desafiar
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
