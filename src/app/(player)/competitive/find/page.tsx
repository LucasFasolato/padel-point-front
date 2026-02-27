'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Clock } from 'lucide-react';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { useMyPlayerProfile } from '@/hooks/use-player-profile';

export type FindMode = 'FIND_RIVAL' | 'FIND_PARTNER' | 'FIND_TEAM';

const MODES: Array<{
  mode: FindMode;
  emoji: string;
  title: string;
  subtitle: string;
}> = [
  {
    mode: 'FIND_RIVAL',
    emoji: '🧍',
    title: 'Buscar 1 rival',
    subtitle: 'Ya tengo compañero',
  },
  {
    mode: 'FIND_PARTNER',
    emoji: '🤝',
    title: 'Buscar compañero',
    subtitle: 'Me falta partner',
  },
  {
    mode: 'FIND_TEAM',
    emoji: '👥',
    title: 'Buscar pareja rival',
    subtitle: 'Tengo dupla, buscamos contra otra dupla',
  },
];

export default function FindPage() {
  const router = useRouter();
  const { data: playerProfile } = useMyPlayerProfile();
  const city = playerProfile?.location?.city;

  return (
    <>
      <PublicTopBar title="Buscar partido" backHref="/competitive" />

      <div className="space-y-5 px-4 py-5">
        {/* Title + city pill */}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl font-bold text-slate-900">¿Qué buscás?</h1>
          {city && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              📍 {city}
            </span>
          )}
        </div>

        {/* Mode cards */}
        <div className="space-y-3">
          {MODES.map(({ mode, emoji, title, subtitle }) => (
            <button
              key={mode}
              type="button"
              onClick={() => router.push(`/competitive/find/configure?mode=${mode}`)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all active:scale-[0.99] hover:border-[#0E7C66]/30 hover:shadow-md"
            >
              <span className="text-3xl leading-none">{emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-slate-900">{title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
              </div>
              <ChevronRight
                size={18}
                className="shrink-0 text-slate-300 transition-colors group-hover:text-[#0E7C66]"
              />
            </button>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400">
          Los pedidos se ven solo en tu ciudad.
        </p>

        {/* My requests shortcut */}
        <button
          type="button"
          onClick={() => router.push('/competitive/find/my-requests')}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 active:scale-[0.98]"
        >
          <Clock size={15} />
          Ver mis pedidos enviados
        </button>
      </div>
    </>
  );
}
