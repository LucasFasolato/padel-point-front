import type { RankingEntry } from '@/types/competitive';
import { CategoryBadge } from './category-badge';
import { cn } from '@/lib/utils';

interface RankingTableProps {
  players: RankingEntry[];
  currentUserId?: string;
  onChallenge?: (playerId: string) => void;
  className?: string;
}

export function RankingTable({ 
  players, 
  currentUserId, 
  onChallenge,
  className 
}: RankingTableProps) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200', className)}>
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
              Jugador
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
              Cat.
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
              ELO
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
              PJ
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
              V/D
            </th>
            {onChallenge && (
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                Acción
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {players.map((player, index) => {
            const isCurrentUser = player.userId === currentUserId;
            
            return (
              <tr 
                key={player.userId}
                className={cn(
                  'transition-colors hover:bg-slate-50',
                  isCurrentUser && 'bg-blue-50/50 font-medium'
                )}
              >
                <td className="px-4 py-3 text-sm text-slate-900">
                  {index + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">
                    {player.displayName}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-blue-600">(vos)</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <CategoryBadge category={player.category} size="sm" />
                </td>
                <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                  {player.elo}
                </td>
                <td className="px-4 py-3 text-center text-sm text-slate-600">
                  {player.matchesPlayed}
                </td>
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
  );
}