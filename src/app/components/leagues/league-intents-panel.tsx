'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Swords } from 'lucide-react';
import { IntentCard } from '@/app/components/competitive/intent-card';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useChallengeActions } from '@/hooks/use-challenges';
import { useIntents } from '@/hooks/use-intents';
import {
  isIntentActive,
  isLeagueChallengeIntent,
  sortIntentsByActiveThenRecency,
} from '@/lib/intents';
import type { UserIntent } from '@/types/competitive';

interface LeagueIntentsPanelProps {
  leagueId: string;
  className?: string;
}

function renderableLeagueIntents(items: UserIntent[]): UserIntent[] {
  return items.filter(
    (intent) => isLeagueChallengeIntent(intent) || intent.intentType === 'CREATED_INTENT'
  );
}

export function LeagueIntentsPanel({ leagueId, className }: LeagueIntentsPanelProps) {
  const router = useRouter();
  const intentsQuery = useIntents({ leagueId });
  const { acceptDirect, rejectDirect } = useChallengeActions();

  const [actingChallengeId, setActingChallengeId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const sortedItems = useMemo(
    () => renderableLeagueIntents(intentsQuery.items).sort(sortIntentsByActiveThenRecency),
    [intentsQuery.items]
  );

  const activeItems = sortedItems.filter(isIntentActive);
  const historyItems = sortedItems.filter((intent) => !isIntentActive(intent));

  const onChallengeAction = async (action: 'accept' | 'reject', challengeId: string) => {
    setActionError(null);
    setActingChallengeId(challengeId);
    try {
      if (action === 'accept') await acceptDirect.mutateAsync(challengeId);
      else await rejectDirect.mutateAsync(challengeId);
    } catch {
      setActionError('No pudimos actualizar el desafio. Reintenta.');
    } finally {
      setActingChallengeId(null);
    }
  };

  if (intentsQuery.isLoading) {
    return (
      <div className={className}>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (intentsQuery.isError) {
    return (
      <div className={className}>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-semibold text-amber-900">
            No pudimos cargar los desafios
          </p>
          <button
            type="button"
            onClick={() => intentsQuery.refetch()}
            className="mt-3 min-h-[44px] w-full rounded-xl bg-[#0E7C66] px-4 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <div className={className}>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F7F8FA] py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <Swords size={22} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Sin desafios en esta liga</p>
          <p className="mt-1 px-6 text-xs text-slate-500">
            Cuando tengas actividad de desafios aparecera aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <section className="space-y-3">
        {activeItems.length > 0 && (
          <div className="space-y-3">
            {activeItems.map((intent) => (
              <IntentCard
                key={intent.id}
                intent={intent}
                isLoading={intent.challengeId ? actingChallengeId === intent.challengeId : false}
                labels={{ view: 'Ver', report: 'Reportar' }}
                onAcceptChallenge={(challengeId) => onChallengeAction('accept', challengeId)}
                onDeclineChallenge={(challengeId) => onChallengeAction('reject', challengeId)}
                onViewMatch={(matchId) => router.push(`/matches/${matchId}`)}
                onReportChallenge={(challengeId) =>
                  router.push(`/competitive/challenges/${challengeId}/report`)
                }
              />
            ))}
          </div>
        )}

        {historyItems.length > 0 && (
          <div className="space-y-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Historico
            </p>
            {historyItems.map((intent) => (
              <IntentCard
                key={intent.id}
                intent={intent}
                labels={{ view: 'Ver', report: 'Reportar' }}
                onViewMatch={(matchId) => router.push(`/matches/${matchId}`)}
                onReportChallenge={(challengeId) =>
                  router.push(`/competitive/challenges/${challengeId}/report`)
                }
              />
            ))}
          </div>
        )}

        {actionError && (
          <p
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {actionError}
          </p>
        )}
      </section>
    </div>
  );
}
