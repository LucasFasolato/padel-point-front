'use client';

import { useMemo, useState } from 'react';
import { Clock3, Plus, Swords } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useLeagueChallenges,
  useCreateLeagueChallenge,
  useAcceptLeagueChallenge,
  useDeclineLeagueChallenge,
} from '@/hooks/use-leagues';
import type { LeagueChallengeScope, LeagueMember } from '@/types/leagues';
import { LeagueChallengeCreateModal } from './league-challenge-create-modal';

interface LeagueChallengesSectionProps {
  leagueId: string;
  members: LeagueMember[];
  currentUserId?: string;
  className?: string;
}

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase();
}

function getStatusLabel(status: string): string {
  const value = normalizeStatus(status);
  if (value === 'pending') return 'Pendiente';
  if (value === 'accepted' || value === 'ready') return 'Aceptado';
  if (value === 'completed' || value === 'linked') return 'Completado';
  if (value === 'declined' || value === 'rejected') return 'Rechazado';
  if (value === 'expired') return 'Expirado';
  return status;
}

function getStatusColors(status: string): string {
  const value = normalizeStatus(status);
  if (value === 'pending') return 'bg-amber-100 text-amber-800';
  if (value === 'accepted' || value === 'ready') return 'bg-emerald-100 text-emerald-800';
  if (value === 'completed' || value === 'linked') return 'bg-blue-100 text-blue-800';
  if (value === 'declined' || value === 'rejected') return 'bg-rose-100 text-rose-700';
  if (value === 'expired') return 'bg-slate-100 text-slate-600';
  return 'bg-slate-100 text-slate-700';
}

function getExpirationText(expiresAt?: string | null, createdAt?: string): string {
  const target = expiresAt ? new Date(expiresAt) : new Date(new Date(createdAt ?? Date.now()).getTime() + 3 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(target.getTime())) return 'Vence en 3 días';

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return 'Expirado';

  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  if (days <= 1) return 'Vence hoy';
  return `Vence en ${days} días`;
}

export function LeagueChallengesSection({
  leagueId,
  members,
  currentUserId,
  className,
}: LeagueChallengesSectionProps) {
  const [scope, setScope] = useState<LeagueChallengeScope>('active');
  const [showCreate, setShowCreate] = useState(false);

  const listQuery = useLeagueChallenges(leagueId, scope);
  const createChallenge = useCreateLeagueChallenge(leagueId);
  const acceptChallenge = useAcceptLeagueChallenge(leagueId);
  const declineChallenge = useDeclineLeagueChallenge(leagueId);

  const challenges = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setScope('active')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
              scope === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            )}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setScope('history')}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
              scope === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            )}
          >
            History
          </button>
        </div>

        <Button size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus size={14} />
          Desafiar
        </Button>
      </div>

      {listQuery.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((idx) => (
            <Skeleton key={idx} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-slate-900">
            {scope === 'active' ? 'No hay desafíos activos' : 'No hay desafíos en historial'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {scope === 'active'
              ? 'Creá un desafío para coordinar el próximo partido.'
              : 'Acá vas a ver desafíos completados, rechazados o expirados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {challenges.map((challenge) => {
            const status = normalizeStatus(challenge.status);
            const isPending = status === 'pending';
            const isOpponent = challenge.opponent.userId === currentUserId;
            const isChallenger = challenge.challenger.userId === currentUserId;

            return (
              <div key={challenge.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {challenge.challenger.displayName || 'Jugador'} vs {challenge.opponent.displayName || 'Jugador'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">Desafío #{challenge.id.slice(0, 8)}</p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', getStatusColors(challenge.status))}>
                    {getStatusLabel(challenge.status)}
                  </span>
                </div>

                {challenge.message && (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {challenge.message}
                  </p>
                )}

                {scope === 'active' && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock3 size={12} />
                    {getExpirationText(challenge.expiresAt, challenge.createdAt)}
                  </p>
                )}

                {scope === 'active' && isPending && isOpponent && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => declineChallenge.mutate(challenge.id)}
                      disabled={acceptChallenge.isPending || declineChallenge.isPending}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => acceptChallenge.mutate(challenge.id)}
                      disabled={acceptChallenge.isPending || declineChallenge.isPending}
                    >
                      Accept
                    </Button>
                  </div>
                )}

                {scope === 'active' && isPending && isChallenger && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <Swords size={12} />
                    Esperando respuesta del rival.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <LeagueChallengeCreateModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        members={members}
        currentUserId={currentUserId}
        isPending={createChallenge.isPending}
        onSubmit={(payload) => {
          createChallenge.mutate(payload, {
            onSuccess: () => setShowCreate(false),
          });
        }}
      />
    </div>
  );
}
