'use client';

import { useRouter } from 'next/navigation';
import { Clock, ChevronRight, XCircle } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import { useChallenges, useChallengeActions } from '@/hooks/use-challenges';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Challenge } from '@/types/competitive';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  ready: 'Listo para jugar',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  ready: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  cancelled: 'bg-slate-100 text-slate-500 ring-slate-200/50',
};

export default function MyRequestsPage() {
  const router = useRouter();
  const { outbox } = useChallenges();
  const { cancel } = useChallengeActions();

  const challenges = outbox.data ?? [];

  // Sort: pending first, then by date desc
  const sorted = [...challenges].sort((a, b) => {
    const aActive = ['pending', 'accepted', 'ready'].includes(a.status);
    const bActive = ['pending', 'accepted', 'ready'].includes(b.status);
    if (aActive !== bActive) return aActive ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const active = sorted.filter((c) => ['pending', 'accepted', 'ready'].includes(c.status));
  const past = sorted.filter((c) => !['pending', 'accepted', 'ready'].includes(c.status));

  const handleCancel = (id: string) => {
    cancel.mutate(id);
  };

  return (
    <>
      <PublicTopBar title="Mis pedidos" backHref="/competitive/find" />

      <div className="space-y-5 px-4 py-4 pb-8">
        {outbox.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : outbox.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
            <p className="text-sm font-semibold text-rose-900">
              No pudimos cargar tus pedidos
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => outbox.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : challenges.length === 0 ? (
          <EmptyState onNavigate={() => router.push('/competitive/find')} />
        ) : (
          <>
            {/* Active requests */}
            {active.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Activos ({active.length})
                </h2>
                <div className="space-y-3">
                  {active.map((c) => (
                    <RequestCard
                      key={c.id}
                      challenge={c}
                      canCancel={c.status === 'pending'}
                      onCancel={() => handleCancel(c.id)}
                      onView={() => router.push(`/competitive/challenges/${c.id}`)}
                      isCancelling={cancel.isPending && cancel.variables === c.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past requests */}
            {past.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Anteriores
                </h2>
                <div className="space-y-3">
                  {past.slice(0, 10).map((c) => (
                    <RequestCard
                      key={c.id}
                      challenge={c}
                      canCancel={false}
                      onCancel={() => {}}
                      onView={() => router.push(`/competitive/challenges/${c.id}`)}
                      isCancelling={false}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Deep links hint */}
            <div className="rounded-2xl border border-slate-100 bg-[#F7F8FA] p-4">
              <p className="text-xs text-slate-500">
                También podés ver tus desafíos completos en{' '}
                <button
                  type="button"
                  className="font-semibold text-[#0E7C66] underline-offset-2 hover:underline"
                  onClick={() => router.push('/competitive/challenges')}
                >
                  Desafíos
                </button>{' '}
                y tus notificaciones en{' '}
                <button
                  type="button"
                  className="font-semibold text-[#0E7C66] underline-offset-2 hover:underline"
                  onClick={() => router.push('/notifications')}
                >
                  Notificaciones
                </button>
                .
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RequestCard({
  challenge,
  canCancel,
  onCancel,
  onView,
  isCancelling,
}: {
  challenge: Challenge;
  canCancel: boolean;
  onCancel: () => void;
  onView: () => void;
  isCancelling: boolean;
}) {
  const opponentName =
    challenge.invitedOpponent?.displayName ??
    challenge.teamB?.p1?.displayName ??
    'Rival desconocido';

  const matchTypeLabel = challenge.matchType === 'FRIENDLY' ? 'Amistoso' : 'Competitivo';
  const statusLabel = STATUS_LABELS[challenge.status] ?? challenge.status;
  const statusColor = STATUS_COLORS[challenge.status] ?? STATUS_COLORS.cancelled;

  const targetCategory = challenge.targetCategory;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {opponentName}
            </p>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusColor}`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {targetCategory && (
              <CategoryBadge
                category={targetCategory as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
                size="sm"
              />
            )}
            <span className="text-xs text-slate-500">{matchTypeLabel}</span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={11} />
              {formatDistanceToNow(new Date(challenge.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>

          {challenge.message && (
            <p className="mt-1.5 truncate text-xs italic text-slate-400">
              &ldquo;{challenge.message}&rdquo;
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onView}
          className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          aria-label="Ver detalle"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {canCancel && (
        <div className="border-t border-slate-100 px-4 py-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isCancelling}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 disabled:opacity-50 hover:text-rose-700"
          >
            <XCircle size={13} />
            {isCancelling ? 'Cancelando...' : 'Cancelar pedido'}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
        📋
      </div>
      <h3 className="text-base font-semibold text-slate-900">No enviaste pedidos aún</h3>
      <p className="mt-2 px-6 text-sm text-slate-500">
        Buscá un rival o compañero y enviá tu primera invitación.
      </p>
      <Button type="button" size="sm" className="mt-5" onClick={onNavigate}>
        Buscar partido
      </Button>
    </div>
  );
}
