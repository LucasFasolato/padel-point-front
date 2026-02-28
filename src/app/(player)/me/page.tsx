'use client';

import { useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useCompetitiveProfile } from '@/hooks/use-competitive-profile';
import { useMyPlayerProfile } from '@/hooks/use-player-profile';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useAuthStore } from '@/store/auth-store';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { AccountHeaderCard } from '@/app/components/account/account-header-card';
import { AccountQuickActions } from '@/app/components/account/account-quick-actions';

const ROLE_LABELS: Record<string, string> = {
  player: 'Jugador',
  admin: 'Administrador',
  coach: 'Entrenador',
};

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 30) return `Hace ${diffDays} días`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(diffDays / 365);
  return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
}

export default function MyAccountPage() {
  const { user } = useAuthStore();

  const {
    data: competitiveProfile,
    isLoading: competitiveLoading,
    isError: competitiveError,
    refetch: refetchCompetitive,
  } = useCompetitiveProfile();

  const { data: playerProfile, isLoading: playerLoading } = useMyPlayerProfile();

  const { data: unreadCount } = useUnreadCount();

  const loading = competitiveLoading || playerLoading;

  const handleRetry = useCallback(() => {
    void refetchCompetitive();
  }, [refetchCompetitive]);

  const hasLocation = !!(
    playerProfile?.location?.city || playerProfile?.location?.province
  );

  const isStaging =
    typeof window !== 'undefined' && window.location.hostname.includes('staging');

  const roleLabel = user?.role
    ? (ROLE_LABELS[user.role.toLowerCase()] ?? user.role)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicTopBar title="Mi cuenta" />

      <div className="space-y-4 px-4 py-4 pb-24">
        {/* 1 — Identity card */}
        {loading ? (
          <Skeleton className="h-44 w-full rounded-2xl" />
        ) : competitiveError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-8 text-center">
            <AlertTriangle size={28} className="text-rose-400" />
            <div>
              <p className="text-sm font-semibold text-rose-700">
                No pudimos cargar tu perfil
              </p>
              <p className="mt-0.5 text-xs text-rose-500">
                Revisá tu conexión e intentá nuevamente.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              Reintentar
            </Button>
          </div>
        ) : (
          <AccountHeaderCard
            displayName={competitiveProfile?.displayName}
            email={competitiveProfile?.email ?? user?.email}
            category={competitiveProfile?.category}
            city={playerProfile?.location?.city}
            province={playerProfile?.location?.province}
          />
        )}

        {/* 2 — Quick actions */}
        {!competitiveError &&
          (loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <AccountQuickActions
              hasLocation={hasLocation}
              unreadCount={unreadCount ?? 0}
            />
          ))}

        {/* 3 — Account status */}
        {!loading && !competitiveError && (
          <Card padding="md" as="section">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Estado de cuenta
            </p>
            <div className="divide-y divide-slate-50">
              {roleLabel && (
                <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <span className="text-sm text-slate-500">Rol</span>
                  <span className="text-sm font-semibold text-slate-800">{roleLabel}</span>
                </div>
              )}
              {competitiveProfile?.createdAt && (
                <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <span className="text-sm text-slate-500">Miembro desde</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {formatRelativeDate(competitiveProfile.createdAt)}
                  </span>
                </div>
              )}
              {isStaging && (
                <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <span className="text-sm text-slate-500">Entorno</span>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    Staging
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
