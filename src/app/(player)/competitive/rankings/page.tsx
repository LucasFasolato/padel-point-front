'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { BarChart2, MapPin } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useRankings } from '@/hooks/use-rankings';
import { useCompetitiveProfile } from '@/hooks/use-competitive-profile';
import { useMyPlayerProfile } from '@/hooks/use-player-profile';
import { useAuthStore } from '@/store/auth-store';
import { COMPETITIVE_RANKING_CATEGORIES } from '@/lib/competitive-constants';
import { CATEGORY_LABELS } from '@/lib/competitive-utils';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/competitive';
import type { RankingScope } from '@/types/rankings';
import { MyPositionCard } from './components/my-position-card';
import { ScopeSelector } from './components/scope-selector';
import { RankingsList } from './components/rankings-list';
import { RankingsSkeleton } from './components/rankings-skeleton';

// ─── Category selector ───────────────────────────────────────────────────────

const CATEGORY_TABS: { label: string; value: Category | undefined }[] = [
  { label: 'Todas', value: undefined },
  ...COMPETITIVE_RANKING_CATEGORIES.map((c) => ({
    label: CATEGORY_LABELS[c],
    value: c as Category,
  })),
];

function CategorySelector({
  value,
  onChange,
}: {
  value: Category | undefined;
  onChange: (v: Category | undefined) => void;
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Categoría
      </p>
      <div className="-mx-4 overflow-x-auto px-4 pb-0.5">
        <div className="flex min-w-max gap-1.5">
          {CATEGORY_TABS.map((tab, i) => {
            const isActive = tab.value === value;
            return (
              <button
                key={tab.label}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                onClick={() => onChange(tab.value)}
                className={cn(
                  'min-h-[40px] whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Geo required banner ──────────────────────────────────────────────────────

function GeoRequiredBanner({
  scope,
  onCompleteLocation,
  onEditProfile,
}: {
  scope: RankingScope;
  onCompleteLocation: () => void;
  onEditProfile: () => void;
}) {
  const msg =
    scope === 'city'
      ? 'Necesitás una ciudad configurada para ver el ranking local.'
      : 'Necesitás una provincia configurada para ver el ranking provincial.';

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-5">
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0E7C66]" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Configurá tu ubicación</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{msg}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onCompleteLocation}
          className="min-h-[44px] w-full rounded-xl bg-[#0E7C66] px-4 py-3 text-sm font-semibold text-white transition-opacity active:opacity-80"
        >
          Completar ubicación
        </button>
        <button
          type="button"
          onClick={onEditProfile}
          className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
        >
          Editar perfil
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RankingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [scope, setScope] = useState<RankingScope>('country');
  const [category, setCategory] = useState<Category | undefined>(undefined);

  // Profile data for my-position card and scope derivation
  const profileQuery = useCompetitiveProfile();
  const playerProfileQuery = useMyPlayerProfile();

  const cityName = playerProfileQuery.data?.location?.city ?? null;
  const provinceName = playerProfileQuery.data?.location?.province ?? null;

  // Derive which scopes the user is eligible for based on their location profile
  const availableScopes: RankingScope[] = ['country'];
  if (provinceName) availableScopes.unshift('province');
  if (cityName) availableScopes.unshift('city');

  // If currently selected scope is not available (e.g. user clears location), fall back
  const effectiveScope: RankingScope = availableScopes.includes(scope) ? scope : 'country';

  // Rankings data
  const rankingsQuery = useRankings(effectiveScope, category);
  const items = rankingsQuery.data?.items ?? [];

  // My entry: look for current user in the list
  const myEntry = user?.userId
    ? (items.find((e) => e.userId === user.userId) ?? null)
    : null;

  // Determine if error is a geo-requirement
  const isGeoError =
    rankingsQuery.isError &&
    axios.isAxiosError(rankingsQuery.error) &&
    rankingsQuery.error.response?.status === 409;

  const geoErrorCode = isGeoError
    ? (rankingsQuery.error as { response?: { data?: { code?: string } } }).response?.data?.code
    : null;

  const showGeoRequiredBanner =
    isGeoError && (geoErrorCode === 'CITY_REQUIRED' || geoErrorCode === 'PROVINCE_REQUIRED');

  const isRankingLoading = rankingsQuery.isLoading;
  const isProfileLoading =
    profileQuery.isLoading || (profileQuery.isError && !profileQuery.data);

  const handleScopeChange = (newScope: RankingScope) => {
    setScope(newScope);
  };

  return (
    <>
      <PublicTopBar title="Rankings" backHref="/competitive" />

      <div className="px-4 pb-24 pt-5 space-y-5">
        {/* ── My Position hero ── */}
        <MyPositionCard
          entry={myEntry}
          scope={effectiveScope}
          cityName={cityName}
          provinceName={provinceName}
          isLoading={isRankingLoading || isProfileLoading}
        />

        {/* ── Scope selector (only shown when > 1 scope available) ── */}
        {playerProfileQuery.isLoading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-11 flex-1 rounded-xl" />
              <Skeleton className="h-11 flex-1 rounded-xl" />
              <Skeleton className="h-11 flex-1 rounded-xl" />
            </div>
          </div>
        ) : (
          <ScopeSelector
            value={effectiveScope}
            onChange={handleScopeChange}
            availableScopes={availableScopes}
            cityName={cityName}
            provinceName={provinceName}
          />
        )}

        {/* ── Category selector ── */}
        <CategorySelector value={category} onChange={setCategory} />

        {/* ── Geo required banner ── */}
        {showGeoRequiredBanner && (
          <GeoRequiredBanner
            scope={effectiveScope}
            onCompleteLocation={() => router.push('/competitive/onboarding')}
            onEditProfile={() => router.push('/me/profile')}
          />
        )}

        {/* ── Generic error ── */}
        {rankingsQuery.isError && !showGeoRequiredBanner && (
          <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">
            <p className="text-sm text-red-600">No se pudo cargar el ranking.</p>
            <button
              type="button"
              onClick={() => rankingsQuery.refetch()}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ── Leaderboard ── */}
        {isRankingLoading ? (
          <RankingsSkeleton />
        ) : !rankingsQuery.isError ? (
          <RankingsList
            items={items}
            currentUserId={user?.userId}
            hasNextPage={rankingsQuery.hasNextPage}
            isFetchingNextPage={rankingsQuery.isFetchingNextPage}
            onLoadMore={() => rankingsQuery.fetchNextPage()}
          />
        ) : null}

        {/* ── Empty ranking explanation ── */}
        {!isRankingLoading && !rankingsQuery.isError && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <BarChart2 className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">
              Todavía no hay jugadores en este ranking
            </p>
            <p className="max-w-[28ch] text-xs text-slate-500">
              Jugá al menos 4 partidos competitivos para que aparezcan resultados
            </p>
          </div>
        )}
      </div>
    </>
  );
}
