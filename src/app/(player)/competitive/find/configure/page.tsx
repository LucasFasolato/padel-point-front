'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useCompetitiveProfile } from '@/hooks/use-competitive-profile';
import { cn } from '@/lib/utils';
import type { FindMode } from '../page';
import type { MatchType } from '@/types/competitive';

type Position = 'DRIVE' | 'REVES';

const CATEGORY_LABELS: Record<number, string> = {
  1: '1ra', 2: '2da', 3: '3ra', 4: '4ta',
  5: '5ta', 6: '6ta', 7: '7ma', 8: '8va',
};

const CATEGORY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const MODE_LABELS: Record<FindMode, string> = {
  FIND_RIVAL: 'Buscar 1 rival',
  FIND_PARTNER: 'Buscar compañero',
  FIND_TEAM: 'Buscar pareja rival',
};

function ConfigureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as FindMode | null) ?? 'FIND_RIVAL';

  const { data: profile, isLoading: loadingProfile } = useCompetitiveProfile();
  const defaultCategory = profile?.category ?? 5;

  const [matchType, setMatchType] = useState<MatchType>('COMPETITIVE');
  const [position, setPosition] = useState<Position>('DRIVE');
  const [partnerPosition, setPartnerPosition] = useState<Position>('REVES');
  const [category, setCategory] = useState<number | null>(null);
  const [sameCategory, setSameCategory] = useState(true);

  const resolvedCategory = category ?? defaultCategory;

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('matchType', matchType);
    params.set('category', String(resolvedCategory));
    params.set('sameCategory', String(sameCategory));
    params.set('position', position);
    if (mode === 'FIND_TEAM') {
      params.set('partnerPosition', partnerPosition);
    }
    router.push(`/competitive/find/results?${params.toString()}`);
  };

  return (
    <>
      <PublicTopBar
        title="Configurar búsqueda"
        backHref={`/competitive/find`}
      />

      <div className="space-y-4 px-4 py-4 pb-28">
        {/* Mode label */}
        <p className="text-sm text-slate-500">
          Modo:{' '}
          <span className="font-semibold text-slate-800">{MODE_LABELS[mode]}</span>
        </p>

        {/* Block 1: Match type */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-bold text-slate-900">Tipo de partido</h2>
          <p className="mb-4 text-xs text-slate-400">
            {matchType === 'COMPETITIVE'
              ? 'Competitivo: impacta ranking, visible públicamente'
              : 'Amistoso: solo registro personal, no impacta ranking'}
          </p>
          <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
            <SegmentBtn
              active={matchType === 'COMPETITIVE'}
              onClick={() => setMatchType('COMPETITIVE')}
              label="Competitivo"
            />
            <SegmentBtn
              active={matchType === 'FRIENDLY'}
              onClick={() => setMatchType('FRIENDLY')}
              label="Amistoso"
            />
          </div>
        </section>

        {/* Block 2: Position */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-slate-900">Posición</h2>

          {mode === 'FIND_TEAM' ? (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Yo juego
                </p>
                <PositionToggle value={position} onChange={setPosition} />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Mi compañero
                </p>
                <PositionToggle value={partnerPosition} onChange={setPartnerPosition} />
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Mi posición
              </p>
              <PositionToggle value={position} onChange={setPosition} />
            </div>
          )}
        </section>

        {/* Block 3: Level */}
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-slate-900">Nivel</h2>

          {loadingProfile ? (
            <Skeleton className="h-10 w-full rounded-xl" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                    resolvedCategory === cat
                      ? 'border-[#0E7C66] bg-[#0E7C66]/10 text-[#0E7C66]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          )}

          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={sameCategory}
              onChange={(e) => setSameCategory(e.target.checked)}
              className="h-4 w-4 rounded accent-[#0E7C66]"
            />
            <span>Nivel similar (misma categoría)</span>
          </label>
        </section>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-slate-100 bg-white/95 px-4 pb-6 pt-4 backdrop-blur-sm">
        <Button fullWidth size="lg" onClick={handleSearch}>
          Ver jugadores
        </Button>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SegmentBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
      )}
    >
      {label}
    </button>
  );
}

function PositionToggle({
  value,
  onChange,
}: {
  value: Position;
  onChange: (p: Position) => void;
}) {
  return (
    <div className="flex gap-2">
      {(['DRIVE', 'REVES'] as Position[]).map((pos) => (
        <button
          key={pos}
          type="button"
          onClick={() => onChange(pos)}
          className={cn(
            'flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors',
            value === pos
              ? 'border-[#0E7C66] bg-[#0E7C66]/10 text-[#0E7C66]'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          )}
        >
          {pos === 'DRIVE' ? '🎾 Drive' : '🤚 Revés'}
        </button>
      ))}
    </div>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense
      fallback={
        <>
          <PublicTopBar title="Configurar búsqueda" backHref="/competitive/find" />
          <div className="space-y-4 px-4 py-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </>
      }
    >
      <ConfigureContent />
    </Suspense>
  );
}
