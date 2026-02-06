import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Challenge } from '@/types/competitive';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import { CATEGORY_LABELS } from '@/lib/competitive-utils';

interface ChallengeCardProps {
  challenge: Challenge;
  variant: 'inbox' | 'outbox';
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ChallengeCard({ 
  challenge, 
  variant, 
  onAccept, 
  onReject,
  onCancel,
  className 
}: ChallengeCardProps) {
  const isInbox = variant === 'inbox';
  const isPending = challenge.status === 'pending';
  const isAccepted = challenge.status === 'accepted';
  const isReady = challenge.status === 'ready';
  const isRejected = challenge.status === 'rejected';
  const isCancelled = challenge.status === 'cancelled';

  const creator = challenge.teamA.p1;
  const opponent = isInbox ? creator : challenge.invitedOpponent;

  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white p-4', className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-900">
            {isInbox 
              ? `${creator.displayName} te desafió` 
              : `Desafiaste a ${opponent?.displayName || 'un rival'}`}
          </div>
          {challenge.targetCategory && (
            <div className="text-sm text-slate-600">
              Categoría: {CATEGORY_LABELS[challenge.targetCategory as keyof typeof CATEGORY_LABELS]}
            </div>
          )}
        </div>
        
        {/* Status badge */}
        {isPending && (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
            Pendiente
          </span>
        )}
        {isAccepted && (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
            Aceptado
          </span>
        )}
        {isReady && (
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Listo
          </span>
        )}
        {isRejected && (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            Rechazado
          </span>
        )}
        {isCancelled && (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
            Cancelado
          </span>
        )}
      </div>

      {/* Message */}
      {challenge.message && (
        <div className="mb-3 rounded-md bg-slate-50 p-2 text-sm text-slate-700">
          &quot;{challenge.message}&quot;
        </div>
      )}

      {/* Teams info */}
      {(isAccepted || isReady) && (
        <div className="mb-3 text-sm text-slate-600">
          <div>
            <span className="font-medium">Equipo A:</span> {challenge.teamA.p1.displayName}
            {challenge.teamA.p2 && ` + ${challenge.teamA.p2.displayName}`}
          </div>
          {challenge.teamB.p1 && (
            <div>
              <span className="font-medium">Equipo B:</span> {challenge.teamB.p1.displayName}
              {challenge.teamB.p2 && ` + ${challenge.teamB.p2.displayName}`}
            </div>
          )}
        </div>
      )}

      {/* Footer with actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {formatDistanceToNow(new Date(challenge.createdAt), { 
            addSuffix: true, 
            locale: es 
          })}
        </div>

        {/* Actions */}
        {isInbox && isPending && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={onReject}
            >
              Rechazar
            </Button>
            <Button 
              size="sm"
              variant="primary"
              onClick={onAccept}
            >
              Aceptar
            </Button>
          </div>
        )}

        {!isInbox && (isPending || isAccepted) && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}