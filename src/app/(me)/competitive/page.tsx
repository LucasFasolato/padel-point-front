'use client';

import { useCompetitiveProfile } from '@/hooks/use-competitive-profile';
import { useMyMatches } from '@/hooks/use-matches';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import { EloBadge } from '@/app/components/competitive/elo-badge';
import { StatsSummary } from '@/app/components/competitive/stats-summary';
import { MatchCard } from '@/app/components/competitive/match-card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CompetitivePage() {
  const router = useRouter();
  const { data: profile, isLoading: loadingProfile } = useCompetitiveProfile();
  const { data: matches, isLoading: loadingMatches } = useMyMatches();

  if (loadingProfile) {
    return (
      <>
        <PublicTopBar title="Competitivo" backHref="/" />
        <CompetitivePageSkeleton />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <PublicTopBar title="Competitivo" backHref="/" />
        <CompetitiveEmptyState />
      </>
    );
  }

  // Filtrar solo partidos confirmados para el dashboard
  const confirmedMatches = matches?.filter(m => m.status === 'confirmed').slice(0, 5) || [];

  return (
    <>
      <PublicTopBar title="Competitivo" backHref="/" />
      
      <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
        {/* Hero Section */}
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white shadow-lg">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold">{profile.displayName}</h1>
              <CategoryBadge category={profile.category} size="lg" />
            </div>
            <div className="text-right">
              <EloBadge 
                elo={profile.elo} 
                size="lg" 
                showChange={false}
                className="text-white"
              />
              <div className="mt-1 text-sm opacity-90">
                {profile.matchesPlayed} partidos jugados
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => router.push('/ranking')}
            >
              Ver ranking
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => router.push('/me/challenges')}
            >
              Mis desafíos
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Resumen</h2>
          <StatsSummary
            wins={profile.wins}
            losses={profile.losses}
            totalMatches={profile.matchesPlayed}
          />
        </div>

        {/* Recent Matches */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Últimos partidos</h2>
            {confirmedMatches.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/me/matches')}
              >
                Ver todos
              </Button>
            )}
          </div>

          {loadingMatches ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : confirmedMatches.length > 0 ? (
            <div className="space-y-3">
              {confirmedMatches.map(match => (
                <MatchCard 
                  key={match.id} 
                  match={match}
                  onClick={() => router.push(`/me/matches/${match.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 py-12 text-center">
              <p className="mb-4 text-slate-600">Todavía no jugaste partidos competitivos</p>
              <Button onClick={() => router.push('/me/challenges')}>
                Desafiar jugador
              </Button>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            size="lg"
            onClick={() => router.push('/me/challenges/new')}
          >
            Desafiar jugador
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => router.push('/ranking')}
          >
            Ver ranking
          </Button>
        </div>
      </div>
    </>
  );
}

function CompetitivePageSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function CompetitiveEmptyState() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mb-8">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
          <span className="text-4xl">🏆</span>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900">
          Activá tu perfil competitivo
        </h1>
        <p className="text-slate-600">
          Seguí tu progreso, desafiá amigos y mejorá tu juego
        </p>
      </div>
      
      <Button 
        size="lg"
        onClick={() => router.push('/me/competitive/onboarding')}
      >
        Activar ahora
      </Button>
    </div>
  );
}