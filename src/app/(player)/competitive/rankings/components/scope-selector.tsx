import { cn } from '@/lib/utils';
import type { RankingScope } from '@/types/rankings';

interface ScopeOption {
  value: RankingScope;
  label: string;
  sublabel: string;
}

const ALL_SCOPES: ScopeOption[] = [
  { value: 'city', label: 'Ciudad', sublabel: 'Tu ciudad' },
  { value: 'province', label: 'Provincia', sublabel: 'Tu provincia' },
  { value: 'country', label: 'País', sublabel: 'Argentina' },
];

interface ScopeSelectorProps {
  value: RankingScope;
  onChange: (scope: RankingScope) => void;
  availableScopes: RankingScope[];
  cityName?: string | null;
  provinceName?: string | null;
}

export function ScopeSelector({
  value,
  onChange,
  availableScopes,
  cityName,
  provinceName,
}: ScopeSelectorProps) {
  const visibleScopes = ALL_SCOPES.filter((s) => availableScopes.includes(s.value));

  // Enrich sublabels with actual location names if available
  const enrichedScopes = visibleScopes.map((s) => {
    if (s.value === 'city' && cityName) return { ...s, sublabel: cityName };
    if (s.value === 'province' && provinceName) return { ...s, sublabel: provinceName };
    return s;
  });

  if (enrichedScopes.length <= 1) return null;

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Alcance
      </p>
      <div className="flex gap-2">
        {enrichedScopes.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex min-h-[44px] flex-1 flex-col items-center justify-center rounded-xl border px-3 py-2.5 transition-all',
                isActive
                  ? 'border-[#0E7C66] bg-[#0E7C66] text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <span className="text-sm font-bold leading-tight">{opt.label}</span>
              <span
                className={cn(
                  'mt-0.5 text-[10px] font-medium leading-none',
                  isActive ? 'text-white/75' : 'text-slate-400',
                )}
              >
                {opt.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
