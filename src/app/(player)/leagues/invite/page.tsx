'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Users, Calendar, AlertTriangle } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useInviteByToken, useAcceptInvite, useDeclineInvite } from '@/hooks/use-leagues';
import { formatDateRange } from '@/lib/league-utils';

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const { data: invite, isLoading, error } = useInviteByToken(token);
  const acceptMutation = useAcceptInvite();
  const declineMutation = useDeclineInvite();

  const isActing = acceptMutation.isPending || declineMutation.isPending;

  if (!token) {
    return <InvalidState message="El enlace de invitación no es válido." />;
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48 rounded" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !invite) {
    const is404 = (error as { response?: { status?: number } })?.response?.status === 404;
    const isExpired = (error as { response?: { status?: number } })?.response?.status === 410;

    return (
      <InvalidState
        message={
          isExpired
            ? 'Esta invitación expiró.'
            : is404
              ? 'Invitación no encontrada.'
              : 'No se pudo cargar la invitación.'
        }
      />
    );
  }

  const handleAccept = () => {
    acceptMutation.mutate(token, {
      onSuccess: () => router.push('/leagues'),
    });
  };

  const handleDecline = () => {
    declineMutation.mutate(token, {
      onSuccess: () => router.push('/leagues'),
    });
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Users size={28} className="text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Te invitaron a una liga</h1>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-medium">{invite.creatorName}</span> te invitó a unirte.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">{invite.leagueName}</h2>

        <div className="flex items-center gap-4 text-sm text-slate-600">
          {formatDateRange(invite.startDate, invite.endDate) ? (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              {formatDateRange(invite.startDate, invite.endDate)}
            </span>
          ) : (
            <span className="text-slate-500">Liga permanente</span>
          )}
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-400" />
            {invite.membersCount} miembros
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={handleDecline}
          disabled={isActing}
          loading={declineMutation.isPending}
        >
          Rechazar
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={handleAccept}
          disabled={isActing}
          loading={acceptMutation.isPending}
        >
          Unirme
        </Button>
      </div>
    </div>
  );
}

function InvalidState({ message }: { message: string }) {
  const router = useRouter();

  return (
    <div className="px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle size={28} className="text-amber-600" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">{message}</h2>
      <p className="mb-6 text-sm text-slate-600">
        Pedile un nuevo enlace al creador de la liga.
      </p>
      <Button variant="outline" onClick={() => router.push('/leagues')}>
        Ir a mis ligas
      </Button>
    </div>
  );
}

export default function InvitePage() {
  return (
    <>
      <PublicTopBar title="Invitación" backHref="/leagues" />
      <Suspense
        fallback={
          <div className="px-4 py-6 space-y-4">
            <Skeleton className="h-8 w-48 rounded" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        }
      >
        <InviteContent />
      </Suspense>
    </>
  );
}
