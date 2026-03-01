'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { BarChart2, MapPin } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { PageShell } from '@/app/components/shell/page-shell';
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

type UnknownRecord = Record<string, unknown>;

const PROVINCE_CODE_BY_NAME: Record<string, string> = {
  'buenos aires': 'AR-B',
  'ciudad autonoma de buenos aires': 'AR-C',
  caba: 'AR-C',
  'capital federal': 'AR-C',
  catamarca: 'AR-K',
  chaco: 'AR-H',
  chubut: 'AR-U',
  cordoba: 'AR-X',
  corrientes: 'AR-W',
  'entre rios': 'AR-E',
  formosa: 'AR-P',
  jujuy: 'AR-Y',
  'la pampa': 'AR-L',
  'la rioja': 'AR-F',
  mendoza: 'AR-M',
  misiones: 'AR-N',
  neuquen: 'AR-Q',
  'rio negro': 'AR-R',
  salta: 'AR-A',
  'san juan': 'AR-J',
  'san luis': 'AR-D',
  'santa cruz': 'AR-Z',
  'santa fe': 'AR-S',
  'santiago del estero': 'AR-G',
  'tierra del fuego': 'AR-V',
  'tierra del fuego antartida e islas del atlantico sur': 'AR-V',
  tucuman: 'AR-T',
};

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[,.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProvinceName(location: unknown): string | null {
  const locationRecord = asRecord(location);
  if (!locationRecord) return null;

  const direct = asTrimmedString(locationRecord.province);
  if (direct) return direct;

  const provinceRecord = asRecord(locationRecord.province);
  return asTrimmedString(provinceRecord?.name);
}

function getCityName(location: unknown): string | null {
  const locationRecord = asRecord(location);
  if (!locationRecord) return null;

  // Explicit cityName field (preferred — new backend shape)
  const fromCityName = asTrimmedString(locationRecord.cityName);
  if (fromCityName) return fromCityName;

  // Scalar city string
  const direct = asTrimmedString(locationRecord.city);
  if (direct) return direct;

  // Nested city object
  const cityRecord = asRecord(locationRecord.city);
  return asTrimmedString(cityRecord?.name);
}

function getProvinceCode(location: unknown): string | null {
  const locationRecord = asRecord(location);
  if (!locationRecord) return null;

  const directCode = asTrimmedString(locationRecord.provinceCode);
  if (directCode) {
    const normalized = directCode.toUpperCase();
    if (/^[A-Z]{2}-[A-Z]$/.test(normalized)) return normalized;
    if (/^[A-Z]$/.test(normalized)) return `AR-${normalized}`;
    return normalized;
  }

  const provinceName = getProvinceName(location);
  if (!provinceName) return null;
  return PROVINCE_CODE_BY_NAME[normalizeText(provinceName)] ?? null;
}

function getCityId(location: unknown): string | null {
  const locationRecord = asRecord(location);
  if (!locationRecord) return null;

  const directCityId = asTrimmedString(locationRecord.cityId);
  if (directCityId) return directCityId;

  const cityRecord = asRecord(locationRecord.city);
  return asTrimmedString(cityRecord?.id) ?? asTrimmedString(cityRecord?.cityId);
}

function getGeoRequiredScopeFromError(error: unknown): RankingScope | null {
  if (!axios.isAxiosError(error)) return null;
  const status = error.response?.status;
  if (status !== 400 && status !== 409) return null;

  const code = (error.response?.data as { code?: unknown } | undefined)?.code;
  if (code === 'CITY_REQUIRED') return 'city';
  if (code === 'PROVINCE_REQUIRED') return 'province';
  return null;
}

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
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800',
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
      ? 'Necesitas una ciudad configurada para ver el ranking local.'
      : 'Necesitas una provincia configurada para ver el ranking provincial.';

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-5">
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#0E7C66]" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Configura tu ubicacion</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{msg}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onCompleteLocation}
          className="min-h-[44px] w-full rounded-xl bg-[#0E7C66] px-4 py-3 text-sm font-semibold text-white transition-opacity active:opacity-80"
        >
          Completar ubicacion
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

export default function RankingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [scope, setScope] = useState<RankingScope>('country');
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [geoRequiredScope, setGeoRequiredScope] = useState<RankingScope | null>(null);

  const profileQuery = useCompetitiveProfile();
  const playerProfileQuery = useMyPlayerProfile();

  const location = playerProfileQuery.data?.location;
  const cityName = getCityName(location);
  const provinceName = getProvinceName(location);
  const cityId = getCityId(location);
  const provinceCode = getProvinceCode(location);

  // CITY is usable when we have either a cityId OR the (cityName + provinceCode) pair
  // that the backend accepts as a fallback resolver.
  const canUseCity = !!cityId || (!!cityName && !!provinceCode);
  const canUseProvince = !!provinceCode;

  const availableScopes: RankingScope[] = ['country'];
  if (canUseProvince) availableScopes.unshift('province');
  if (canUseCity) availableScopes.unshift('city');

  const selectedScopeIsAvailable = availableScopes.includes(scope);
  const effectiveScope: RankingScope = selectedScopeIsAvailable ? scope : 'country';

  const missingProvinceParam = scope === 'province' && !canUseProvince;
  const missingCityParam = scope === 'city' && !canUseCity;
  const missingRequiredGeoParam = missingProvinceParam || missingCityParam;

  const rankingsQuery = useRankings({
    scope: effectiveScope,
    category,
    provinceCode,
    cityId,
    cityName,
    enabled: !missingRequiredGeoParam,
  });
  const items = rankingsQuery.data?.items ?? [];

  const myEntry = user?.userId ? (items.find((e) => e.userId === user.userId) ?? null) : null;

  const geoErrorScope = rankingsQuery.isError
    ? getGeoRequiredScopeFromError(rankingsQuery.error)
    : null;
  const bannerScope = geoRequiredScope ?? geoErrorScope;
  const showGeoRequiredBanner = bannerScope !== null;

  const isRankingLoading = rankingsQuery.isLoading;
  const isProfileLoading =
    profileQuery.isLoading || (profileQuery.isError && !profileQuery.data);

  useEffect(() => {
    if (scope === 'province' && !canUseProvince) {
      setGeoRequiredScope('province');
      setScope('country');
      return;
    }

    if (scope === 'city' && !canUseCity) {
      setGeoRequiredScope('city');
      setScope(canUseProvince ? 'province' : 'country');
    }
  }, [scope, canUseProvince, canUseCity]);

  useEffect(() => {
    if (geoRequiredScope === 'province' && canUseProvince) {
      setGeoRequiredScope(null);
      return;
    }

    if (geoRequiredScope === 'city' && canUseCity) {
      setGeoRequiredScope(null);
    }
  }, [geoRequiredScope, canUseProvince, canUseCity]);

  const handleScopeChange = (newScope: RankingScope) => {
    if (newScope === 'province' && !canUseProvince) {
      setGeoRequiredScope('province');
      setScope('country');
      return;
    }

    if (newScope === 'city' && !canUseCity) {
      setGeoRequiredScope('city');
      setScope(canUseProvince ? 'province' : 'country');
      return;
    }

    setGeoRequiredScope(null);
    setScope(newScope);
  };

  return (
    <>
      <PublicTopBar title="Rankings" backHref="/competitive" />

      <PageShell className="space-y-5 pt-5">
        <MyPositionCard
          entry={myEntry}
          scope={effectiveScope}
          cityName={cityName}
          provinceName={provinceName}
          isLoading={isRankingLoading || isProfileLoading}
        />

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

        <CategorySelector value={category} onChange={setCategory} />

        {showGeoRequiredBanner && (
          <GeoRequiredBanner
            scope={bannerScope}
            onCompleteLocation={() => router.push('/competitive/onboarding')}
            onEditProfile={() => router.push('/me/profile')}
          />
        )}

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

        {!isRankingLoading && !rankingsQuery.isError && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <BarChart2 className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">
              Todavia no hay jugadores en este ranking
            </p>
            <p className="max-w-[28ch] text-xs text-slate-500">
              Juga al menos 4 partidos competitivos para que aparezcan resultados
            </p>
          </div>
        )}
      </PageShell>
    </>
  );
}
