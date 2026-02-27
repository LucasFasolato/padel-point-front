'use client';

import { useState } from 'react';
import { useChallenges, useChallengeActions } from '@/hooks/use-challenges';
import type { Challenge } from '@/types/competitive';
import { ChallengeCard } from '@/app/components/competitive/challenge-card';
import { Skeleton } from '@/app/components/ui/skeleton';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

type Tab = 'pendientes' | 'activos' | 'historial';

const TABS: { id: Tab; label: string }[] = [
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'activos', label: 'Activos' },
  { id: 'historial', label: 'Historial' },
];

export default function ChallengesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('pendientes');

  const { inbox, outbox, openChallenges } = useChallenges();
  const { acceptDirect, rejectDirect, cancel, acceptOpen } = useChallengeActions();

  const inboxList = inbox.data ?? [];
  const outboxList = outbox.data ?? [];
  const openList = openChallenges.data ?? [];
  const allList = [...inboxList, ...outboxList];
  const outboxIds = new Set(outboxList.map((c) => c.id));

  const pendingInboxItems = inboxList.filter((c) => c.status === 'pending');
  const pendingOutboxItems = outboxList.filter((c) => c.status === 'pending');
  const pendingOpenItems = openList.filter((c) => c.status === 'pending');
  const pendingCount =
    pendingInboxItems.length + pendingOutboxItems.length + pendingOpenItems.length;

  const activeItems = allList.filter((c) => ['accepted', 'ready'].includes(c.status));

  const historialItems = allList.filter((c) =>
    ['rejected', 'cancelled', 'expired', 'completed', 'finished'].includes(c.status)
  );

  const isLoading = inbox.isLoading || outbox.isLoading;

  return (
    <>
      <PublicTopBar title="Desafíos" backHref="/competitive" />

      <div className="px-4 py-4 pb-28">
        {/* Urgent alert + new button */}
        <div className="mb-4 flex items-center justify-between">
          {pendingInboxItems.length > 0 ? (
            <p className="text-sm font-semibold text-amber-600">
              {pendingInboxItems.length}{' '}
              {pendingInboxItems.length === 1 ? 'desafío' : 'desafíos'} esperando tu respuesta
            </p>
          ) : (
            <span />
          )}
          <Button
            onClick={() => router.push('/competitive/challenges/new')}
            size="sm"
            className="gap-1.5"
          >
            <Plus size={15} />
            Nuevo
          </Button>
        </div>

        {/* Segmented control */}
        <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
          {TABS.map(({ id, label }) => {
            const count =
              id === 'pendientes' ? pendingCount : id === 'activos' ? activeItems.length : 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  tab === id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {label}
                {count > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0E7C66] px-1 text-[10px] font-bold text-white">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* ── Pendientes ── */}
            {tab === 'pendientes' &&
              (pendingCount === 0 ? (
                <EmptyState
                  icon="🎾"
                  message="Sin desafíos pendientes"
                  description="Desafiá a un rival o esperá que alguien te desafíe"
                  actionLabel="Nuevo desafío"
                  onAction={() => router.push('/competitive/challenges/new')}
                />
              ) : (
                <div className="space-y-3">
                  {/* Urgent: received challenges first */}
                  {pendingInboxItems.map((c) => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      variant="inbox"
                      onAccept={() => acceptDirect.mutate(c.id)}
                      onReject={() => rejectDirect.mutate(c.id)}
                      isAcceptPending={acceptDirect.isPending}
                      isRejectPending={rejectDirect.isPending}
                    />
                  ))}

                  {/* Open challenges awaiting acceptance */}
                  {pendingOpenItems.map((c) => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      variant="inbox"
                      onAccept={() => acceptOpen.mutate({ id: c.id })}
                      isAcceptPending={acceptOpen.isPending}
                    />
                  ))}

                  {/* Sent challenges awaiting opponent response */}
                  {pendingOutboxItems.length > 0 && (
                    <>
                      {pendingInboxItems.length + pendingOpenItems.length > 0 && (
                        <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Enviados
                        </p>
                      )}
                      {pendingOutboxItems.map((c) => (
                        <ChallengeCard
                          key={c.id}
                          challenge={c}
                          variant="outbox"
                          onCancel={() => cancel.mutate(c.id)}
                          isCancelPending={cancel.isPending}
                        />
                      ))}
                    </>
                  )}
                </div>
              ))}

            {/* ── Activos ── */}
            {tab === 'activos' &&
              (activeItems.length === 0 ? (
                <EmptyState
                  icon="⚡"
                  message="Sin desafíos activos"
                  description="Cuando aceptes o te acepten un desafío aparecerá aquí"
                  actionLabel="Ver pendientes"
                  onAction={() => setTab('pendientes')}
                />
              ) : (
                <div className="space-y-3">
                  {activeItems.map((c) => (
                    <ChallengeCard key={c.id} challenge={c} variant="ready" />
                  ))}
                </div>
              ))}

            {/* ── Historial ── */}
            {tab === 'historial' &&
              (historialItems.length === 0 ? (
                <EmptyState
                  icon="📋"
                  message="Sin historial"
                  description="Los desafíos finalizados o cancelados aparecerán aquí"
                  actionLabel="Ver pendientes"
                  onAction={() => setTab('pendientes')}
                />
              ) : (
                <div className="space-y-3">
                  {historialItems.map((c) => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      variant={outboxIds.has(c.id) ? 'outbox' : 'inbox'}
                    />
                  ))}
                </div>
              ))}
          </>
        )}
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  message,
  description,
  actionLabel,
  onAction,
}: {
  icon: string;
  message: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-14 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
        {icon}
      </div>
      <h3 className="mb-1 text-base font-semibold text-slate-900">{message}</h3>
      <p className="mb-5 px-6 text-sm text-slate-500">{description}</p>
      <Button onClick={onAction} size="sm" variant="outline">
        {actionLabel}
      </Button>
    </div>
  );
}
