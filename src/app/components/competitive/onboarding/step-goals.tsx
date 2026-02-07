'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import { GOAL_OPTIONS, FREQUENCY_OPTIONS } from '@/lib/onboarding-utils';
import type { PlayerGoal, PlayFrequency } from '@/store/onboarding-store';

interface StepGoalsProps {
  selectedGoal: PlayerGoal | null;
  selectedFrequency: PlayFrequency | null;
  onSelectGoal: (goal: PlayerGoal) => void;
  onSelectFrequency: (frequency: PlayFrequency) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepGoals({
  selectedGoal,
  selectedFrequency,
  onSelectGoal,
  onSelectFrequency,
  onNext,
  onBack,
}: StepGoalsProps) {
  const canContinue = selectedGoal !== null && selectedFrequency !== null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 space-y-8">
        {/* Goal Selection */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">
            ¿Qué te motiva a jugar?
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Nos ayuda a personalizar tu experiencia.
          </p>
          <div className="space-y-2">
            {GOAL_OPTIONS.map((option) => {
              const isSelected = selectedGoal === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelectGoal(option.value)}
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
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Frequency Selection */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            ¿Cuánto jugás por semana?
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            No hay respuesta incorrecta.
          </p>
          <div className="space-y-2">
            {FREQUENCY_OPTIONS.map((option) => {
              const isSelected = selectedFrequency === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelectFrequency(option.value)}
                  className={cn(
                    'w-full rounded-xl border-2 px-4 py-3 text-left transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
                    'active:scale-[0.98]',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <p className="font-semibold text-sm text-slate-900">{option.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-4 space-y-3 border-t border-slate-100">
        <Button size="lg" fullWidth onClick={onNext} disabled={!canContinue}>
          Continuar
        </Button>
        <Button size="lg" fullWidth variant="ghost" onClick={onBack}>
          Volver
        </Button>
      </div>
    </div>
  );
}
