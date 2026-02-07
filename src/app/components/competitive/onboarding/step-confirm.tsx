'use client';

import { Button } from '@/app/components/ui/button';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import { getCategoryLabel, getGoalLabel, getFrequencyLabel } from '@/lib/onboarding-utils';
import type { Category } from '@/types/competitive';
import type { PlayerGoal, PlayFrequency } from '@/store/onboarding-store';

interface StepConfirmProps {
  category: Category;
  goal: PlayerGoal;
  frequency: PlayFrequency;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

export function StepConfirm({
  category,
  goal,
  frequency,
  isSubmitting,
  error,
  onConfirm,
  onBack,
}: StepConfirmProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex-1 px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold text-slate-900 mb-1">
          Todo listo para arrancar
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Revisá tu perfil antes de activarlo.
        </p>

        <div className="rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-200">
          {/* Category */}
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Categoría inicial</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {getCategoryLabel(category)}
              </p>
            </div>
            <CategoryBadge category={category} size="md" />
          </div>

          {/* Goal */}
          <div className="p-4">
            <p className="text-xs text-slate-500 font-medium">Objetivo</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              {getGoalLabel(goal)}
            </p>
          </div>

          {/* Frequency */}
          <div className="p-4">
            <p className="text-xs text-slate-500 font-medium">Frecuencia de juego</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              {getFrequencyLabel(frequency)}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Tu categoría se ajusta automáticamente después de cada partido.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3">
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3 border-t border-slate-100">
        <Button
          size="lg"
          fullWidth
          onClick={onConfirm}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Activar perfil competitivo
        </Button>
        <Button size="lg" fullWidth variant="ghost" onClick={onBack} disabled={isSubmitting}>
          Volver
        </Button>
      </div>
    </div>
  );
}
