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
    return (
      <span className="text-[10px] font-bold text-emerald-500">{`\u25B2${delta}`}</span>
    );
  }
  if (delta < 0) {
    return (
      <span className="text-[10px] font-bold text-rose-500">{`\u25BC${Math.abs(delta)}`}</span>
    );
  }
  return <span className="text-[10px] font-semibold text-slate-400">—</span>;
}

function PositionBadge({ position }: { position: number }) {
  if (position === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-xs font-extrabold text-white shadow-sm">
        1
      </span>
    );
  }
  if (position === 2) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-400 text-xs font-extrabold text-white shadow-sm">
        2
      </span>
    );
  }
  if (position === 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 text-xs font-extrabold text-white shadow-sm">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center text-sm font-semibold text-slate-500">
      {position}
    </span>
  );
}

export function RankingTable({
  players,
  currentUserId,
  onChallenge,
  myRowRef,
  className,
}: RankingTableProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="py-3 pl-4 pr-2 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                #
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Jugador
              </th>
              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cat.
              </th>
              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                ELO
              </th>
              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                PJ
              </th>
              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                V/D
              </th>
              {onChallenge && (
                <th className="py-3 pl-3 pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  &nbsp;
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.map((player, index) => {
              const isCurrentUser = player.userId === currentUserId;
              const position = player.position ?? index + 1;

              return (
                <tr
                  key={player.userId}
                  ref={isCurrentUser ? myRowRef : undefined}
                  data-current-user-row={isCurrentUser ? 'true' : undefined}
                  data-ranking-user-id={player.userId}
                  className={cn(
                    'group transition-colors duration-150',
                    isCurrentUser
                      ? 'bg-emerald-50/70 hover:bg-emerald-50'
                      : 'hover:bg-slate-50/80'
                  )}
                >
                  {/* Position */}
                  <td className="py-3.5 pl-4 pr-2">
                    <div className="flex items-center gap-1.5">
                      <PositionBadge position={position} />
                      <PositionDelta delta={player.positionDelta} />
                    </div>
                  </td>

                  {/* Player name */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      {isCurrentUser && (
                        <span className="h-5 w-1 rounded-full bg-emerald-500" aria-hidden="true" />
                      )}
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          isCurrentUser ? 'text-emerald-900' : 'text-slate-800'
                        )}
                      >
                        {player.displayName}
                      </span>
                      {isCurrentUser && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          Vos
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3.5 text-center">
                    <CategoryBadge category={player.category} size="sm" />
                  </td>

                  {/* ELO — visually prominent */}
                  <td className="px-3 py-3.5 text-center">
                    <span
                      className={cn(
                        'text-base font-extrabold tracking-tight',
                        isCurrentUser ? 'text-emerald-600' : 'text-slate-900'
                      )}
                    >
                      {player.elo}
                    </span>
                  </td>

                  {/* Matches played */}
                  <td className="px-3 py-3.5 text-center text-sm text-slate-500">
                    {player.matchesPlayed}
                  </td>

                  {/* Wins / Losses */}
                  <td className="px-3 py-3.5 text-center">
                    <span className="text-sm font-semibold text-emerald-600">{player.wins}</span>
                    <span className="mx-0.5 text-xs text-slate-300">/</span>
                    <span className="text-sm font-semibold text-rose-500">{player.losses}</span>
                  </td>

                  {/* Challenge action */}
                  {onChallenge && (
                    <td className="py-3.5 pl-3 pr-4 text-right">
                      {!isCurrentUser ? (
                        <button
                          onClick={() => onChallenge(player.userId)}
                          className="rounded-lg border border-emerald-400 px-3 py-1.5 text-xs font-bold text-emerald-600 transition-colors duration-150 hover:bg-emerald-50 hover:border-emerald-500 active:bg-emerald-100"
                        >
                          Desafiar
                        </button>
                      ) : (
                        <span className="inline-block w-[70px]" />
                      )}
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
