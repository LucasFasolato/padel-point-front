'use client';

import { useState } from 'react';
import { useMyMatches } from '@/hooks/use-matches';
import { MatchCard } from '@/app/components/competitive/match-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Skeleton } from '@/app/components/ui/skeleton';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';

type FilterType = 'all' | 'wins' | 'losses';

export default function CompetitiveMatchesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: matches, isLoading } = useMyMatches();

  // Filtrar solo confirmados
  const confirmedMatches = matches?.filter(m => m.status === 'confirmed') || [];

  const filteredMatches = confirmedMatches.filter(match => {
    if (filter === 'wins') return match.isWin;
    if (filter === 'losses') return !match.isWin;
    return true;
  });

  return (
    <>
      <PublicTopBar title="Partidos Competitivos" backHref="/competitive" />
      
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="wins">Victorias</TabsTrigger>
            <TabsTrigger value="losses">Derrotas</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="space-y-3">
            {filteredMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match}
                variant="detailed"
                onClick={() => router.push(`/competitive/competitive-matches/${match.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 py-16 text-center">
            <p className="mb-4 text-slate-600">
              {filter === 'wins' && 'Todavía no ganaste partidos'}
              {filter === 'losses' && 'Todavía no perdiste partidos'}
              {filter === 'all' && 'Todavía no jugaste partidos competitivos'}
            </p>
            <Button onClick={() => router.push('/competitive/challenges')}>
              Ir a desafíos
            </Button>
          </div>
        )}
      </div>
    </>
  );
}