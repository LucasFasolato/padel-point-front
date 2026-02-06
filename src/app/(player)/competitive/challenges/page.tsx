'use client';

import { useState } from 'react';
import { useChallenges, useChallengeActions } from '@/hooks/use-challenges';
import { ChallengeCard } from '@/app/components/competitive/challenge-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Skeleton } from '@/app/components/ui/skeleton';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';
import { Plus, Inbox, Send, Globe } from 'lucide-react';

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

  const pendingCount = inbox.data?.filter((c) => c.status === 'pending').length || 0;

  return (
    <>
      <PublicTopBar title="Desafíos" backHref="/competitive" />

      <div className="container mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Desafíos</h1>
              <p className="text-sm text-slate-600">Gestioná tus partidos competitivos</p>
            </div>
            <Button
              onClick={() => router.push('/competitive/challenges/new')}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Nuevo desafío</span>
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox size={16} />
              <span>Recibidos</span>
              {pendingCount > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outbox" className="gap-2">
              <Send size={16} />
              <span>Enviados</span>
            </TabsTrigger>
            <TabsTrigger value="open" className="gap-2">
              <Globe size={16} />
              <span>Abiertos</span>
            </TabsTrigger>
          </TabsList>

          {/* INBOX */}
          <TabsContent value="inbox">
            {inbox.isLoading ? (
              <LoadingSkeleton />
            ) : inbox.data && inbox.data.length > 0 ? (
              <div className="space-y-3">
                {inbox.data.map((challenge) => (
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
                icon="📥"
                message="No tenés desafíos pendientes"
                description="Cuando alguien te desafíe, aparecerá acá"
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
                {outbox.data.map((challenge) => (
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
                icon="📤"
                message="No enviaste ningún desafío todavía"
                description="¿Listo para competir?"
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
                {openChallenges.data.map((challenge) => (
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
                icon="🌍"
                message="No hay desafíos abiertos disponibles"
                description="Sé el primero en publicar uno"
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
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40 w-full" />
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
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{message}</h3>
      <p className="mb-6 text-sm text-slate-600">{description}</p>
      <Button onClick={onAction} className="gap-2">
        <Plus size={16} />
        {actionLabel}
      </Button>
    </div>
  );
}