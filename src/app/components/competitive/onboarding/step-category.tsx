'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import { CATEGORY_OPTIONS } from '@/lib/onboarding-utils';
import { CATEGORY_COLORS } from '@/lib/competitive-utils';
import type { Category } from '@/types/competitive';

interface StepCategoryProps {
  selected: Category | null;
  onSelect: (category: Category) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepCategory({ selected, onSelect, onNext, onBack }: StepCategoryProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold text-slate-900">
          ¿Cuál es tu nivel actual?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          No te preocupes, tu categoría se ajusta automáticamente cuando jugás.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <div className="space-y-2">
          {CATEGORY_OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={cn(
                  'w-full rounded-xl border-2 p-4 text-left transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
                  'active:scale-[0.98]',
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                      CATEGORY_COLORS[option.value]
                    )}
                  >
                    {option.value}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                  </div>
                  {isSelected && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2 pl-11">{option.example}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3 border-t border-slate-100">
        <Button size="lg" fullWidth onClick={onNext} disabled={selected === null}>
          Continuar
        </Button>
        <Button size="lg" fullWidth variant="ghost" onClick={onBack}>
          Volver
        </Button>
      </div>
    </div>
  );
}
