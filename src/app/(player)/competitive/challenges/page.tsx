'use client';

import { useState } from 'react';
import { useChallenges, useChallengeActions } from '@/hooks/use-challenges';
import { ChallengeCard } from '@/app/components/competitive/challenge-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Skeleton } from '@/app/components/ui/skeleton';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

type TabType = 'inbox' | 'outbox' | 'open';

export default function ChallengesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>('inbox');
  
  const { inbox, outbox, openChallenges } = useChallenges();
  const { acceptDirect, rejectDirect, cancel, acceptOpen } = useChallengeActions();

  const handleAcceptDirect = (id: string) => {
    acceptDirect.mutate(id);
  };

  const handleRejectDirect = (id: string) => {
    rejectDirect.mutate(id);
  };

  const handleCancel = (id: string) => {
    cancel.mutate(id);
  };

  const handleAcceptOpen = (id: string) => {
    acceptOpen.mutate({ id });
  };

  return (
    <>
      <PublicTopBar title="Desafíos" backHref="/competitive" />
      
      <div className="container mx-auto max-w-4xl px-4 py-6">
        {/* Header con botón flotante */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Desafíos</h1>
          <Button
            onClick={() => router.push('/competitive/challenges/new')}
            className="gap-2"
          >
            <Plus size={18} />
            Nuevo desafío
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inbox">
              Recibidos
              {inbox.data && inbox.data.length > 0 && (
                <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                  {inbox.data.filter(c => c.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outbox">Enviados</TabsTrigger>
            <TabsTrigger value="open">Abiertos</TabsTrigger>
          </TabsList>

          {/* INBOX */}
          <TabsContent value="inbox">
            {inbox.isLoading ? (
              <LoadingSkeleton />
            ) : inbox.data && inbox.data.length > 0 ? (
              <div className="space-y-3">
                {inbox.data.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    variant="inbox"
                    onAccept={() => handleAcceptDirect(challenge.id)}
                    onReject={() => handleRejectDirect(challenge.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                message="No tenés desafíos pendientes"
                actionLabel="Ver desafíos abiertos"
                onAction={() => setTab('open')}
              />
            )}
          </TabsContent>

          {/* OUTBOX */}
          <TabsContent value="outbox">
            {outbox.isLoading ? (
              <LoadingSkeleton />
            ) : outbox.data && outbox.data.length > 0 ? (
              <div className="space-y-3">
                {outbox.data.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    variant="outbox"
                    onCancel={() => handleCancel(challenge.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                message="No enviaste ningún desafío todavía"
                actionLabel="Desafiar jugador"
                onAction={() => router.push('/competitive/challenges/new')}
              />
            )}
          </TabsContent>

          {/* OPEN */}
          <TabsContent value="open">
            {openChallenges.isLoading ? (
              <LoadingSkeleton />
            ) : openChallenges.data && openChallenges.data.length > 0 ? (
              <div className="space-y-3">
                {openChallenges.data.map(challenge => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    variant="inbox"
                    onAccept={() => handleAcceptOpen(challenge.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                message="No hay desafíos abiertos disponibles"
                actionLabel="Crear desafío abierto"
                onAction={() => router.push('/competitive/challenges/new?type=open')}
              />
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
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}

function EmptyState({ 
  message, 
  actionLabel, 
  onAction 
}: { 
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 py-16 text-center">
      <p className="mb-4 text-slate-600">{message}</p>
      <Button onClick={onAction}>{actionLabel}</Button>
    </div>
  );
}