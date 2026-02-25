'use client';

import { useState } from 'react';
import { useChallenges, useChallengeActions } from '@/hooks/use-challenges';
import { ChallengeCard } from '@/app/components/competitive/challenge-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Skeleton } from '@/app/components/ui/skeleton';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';
import { Plus, Inbox, History } from 'lucide-react';

type TabType = 'bandeja' | 'pasados';

export default function ChallengesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>('bandeja');

  const { inbox, outbox, openChallenges } = useChallenges();
  const { acceptDirect, rejectDirect, cancel, acceptOpen } = useChallengeActions();

  const handleAcceptDirect = (id: string) => acceptDirect.mutate(id);
  const handleRejectDirect = (id: string) => rejectDirect.mutate(id);
  const handleCancel = (id: string) => cancel.mutate(id);
  const handleAcceptOpen = (id: string) => acceptOpen.mutate({ id });

  const allChallenges = [...(inbox.data || []), ...(outbox.data || [])];
  const openChallengesList = openChallenges.data || [];

  const bandejaChallenges = allChallenges.filter((c) =>
    ['pending', 'accepted', 'ready'].includes(c.status)
  );
  const bandejaOpen = openChallengesList.filter((c) => c.status === 'pending');
  const pasadosChallenges = allChallenges.filter((c) =>
    ['rejected', 'cancelled', 'expired', 'completed', 'finished'].includes(c.status)
  );

  const pendingInboxCount = (inbox.data || []).filter((c) => c.status === 'pending').length;
  const bandejaCount = bandejaChallenges.length + bandejaOpen.length;
  const isLoading = inbox.isLoading || outbox.isLoading;

  return (
    <>
      <PublicTopBar title="Desafios" backHref="/competitive" />
      <div className="container mx-auto max-w-4xl px-4 py-4 pb-24">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Desafios</h1>
            {pendingInboxCount > 0 && (
              <p className="text-sm font-medium text-amber-600">
                {pendingInboxCount} pendiente{pendingInboxCount !== 1 ? 's' : ''} de respuesta
              </p>
            )}
          </div>
          <Button onClick={() => router.push('/competitive/challenges/new')} className="gap-2" size="lg">
            <Plus size={18} />
            Nuevo
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="bandeja" className="gap-2">
              <Inbox size={15} />
              Bandeja
              {bandejaCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                  {bandejaCount > 9 ? '9+' : bandejaCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pasados" className="gap-2">
              <History size={15} />
              Pasados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bandeja">
            {isLoading ? (
              <LoadingSkeleton />
            ) : bandejaChallenges.length === 0 && bandejaOpen.length === 0 ? (
              <EmptyState
                icon="🎾"
                message="No tenes desafios activos"
                description="Desafia a un rival o espera que alguien te desafie"
                actionLabel="Desafiar jugador"
                onAction={() => router.push('/competitive/challenges/new')}
              />
            ) : (
              <div className="space-y-3">
                {(inbox.data || []).filter((c) => c.status === 'pending').map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} variant="inbox"
                    onAccept={() => handleAcceptDirect(challenge.id)}
                    onReject={() => handleRejectDirect(challenge.id)} />
                ))}
                {allChallenges.filter((c) => c.status === 'ready' || c.status === 'accepted').map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} variant="ready" />
                ))}
                {(outbox.data || []).filter((c) => c.status === 'pending').map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} variant="outbox"
                    onCancel={() => handleCancel(challenge.id)} />
                ))}
                {bandejaOpen.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} variant="inbox"
                    onAccept={() => handleAcceptOpen(challenge.id)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pasados">
            {isLoading ? (
              <LoadingSkeleton />
            ) : pasadosChallenges.length === 0 ? (
              <EmptyState
                icon="📋"
                message="No hay desafios anteriores"
                description="Aqui apareceran los desafios rechazados o cancelados"
                actionLabel="Ver bandeja"
                onAction={() => setTab('bandeja')}
              />
            ) : (
              <div className="space-y-3">
                {pasadosChallenges.map((challenge) => {
                  const isOutbox = (outbox.data || []).some((c) => c.id === challenge.id);
                  return <ChallengeCard key={challenge.id} challenge={challenge} variant={isOutbox ? 'outbox' : 'inbox'} />;
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
    </div>
  );
}

function EmptyState({ icon, message, description, actionLabel, onAction }: {
  icon: string; message: string; description: string; actionLabel: string; onAction: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-14 text-center">
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">{icon}</div>
      <h3 className="mb-1 text-base font-semibold text-slate-900">{message}</h3>
      <p className="mb-5 px-6 text-sm text-slate-500">{description}</p>
      <Button onClick={onAction} size="sm" variant="outline">{actionLabel}</Button>
    </div>
  );
}
