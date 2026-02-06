import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Challenge } from '@/types/competitive';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import { CATEGORY_LABELS } from '@/lib/competitive-utils';
import { useRouter } from 'next/navigation';
import { Trophy, Calendar, MapPin } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  variant: 'inbox' | 'outbox' | 'ready';
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  onReport?: () => void;
  className?: string;
}

export function ChallengeCard({
  challenge,
  variant,
  onAccept,
  onReject,
  onCancel,
  onReport,
  className,
}: ChallengeCardProps) {
  const router = useRouter();
  const isInbox = variant === 'inbox';
  const isReady = variant === 'ready';
  const isPending = challenge.status === 'pending';
  const isAccepted = challenge.status === 'accepted';
  const isReadyStatus = challenge.status === 'ready';
  const isRejected = challenge.status === 'rejected';
  const isCancelled = challenge.status === 'cancelled';

  const creator = challenge.teamA.p1;
  const opponent = isInbox ? creator : challenge.invitedOpponent;

  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>
      <div className="p-4">
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
          {isReadyStatus && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              ✅ Listo para jugar
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
        {(isAccepted || isReadyStatus) && (
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

        {/* Reservation info */}
        {challenge.reservationId && (
          <div className="mb-3 rounded-lg bg-blue-50 p-3">
            <div className="flex items-start gap-2 text-sm">
              <Calendar size={16} className="mt-0.5 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-900">Reserva confirmada</div>
                <div className="text-xs text-blue-700">
                  Tienen una cancha reservada para este partido
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer with actions */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(challenge.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </div>

          {/* Actions */}
          {isInbox && isPending && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onReject}>
                Rechazar
              </Button>
              <Button size="sm" variant="primary" onClick={onAccept}>
                Aceptar
              </Button>
            </div>
          )}

          {!isInbox && (isPending || isAccepted) && (
            <Button size="sm" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Bottom CTA para reportar resultado */}
      {isReady && isReadyStatus && (
        <div className="border-t border-slate-200 bg-gradient-to-br from-green-50 to-emerald-50 p-3">
          <Button
            onClick={() => router.push(`/competitive/challenges/${challenge.id}/report`)}
            className="w-full gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Trophy size={18} />
            Reportar resultado del partido
          </Button>
        </div>
      )}
    </div>
  );
}