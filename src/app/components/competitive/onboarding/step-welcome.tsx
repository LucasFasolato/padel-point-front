'use client';

import { Button } from '@/app/components/ui/button';

interface StepWelcomeProps {
  onNext: () => void;
}

const BENEFITS = [
  {
    icon: '📊',
    title: 'Medí tu nivel real',
    description: 'Tu rating ELO refleja cómo jugás, no solo cuánto jugás.',
  },
  {
    icon: '⚡',
    title: 'Desafiá a cualquiera',
    description: 'Creá desafíos directos o abiertos y encontrá rivales de tu nivel.',
  },
  {
    icon: '🏅',
    title: 'Escalá en el ranking',
    description: 'Cada partido cuenta. Subí de categoría y demostrá tu progreso.',
  },
];

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-6 pt-10 pb-8 text-white text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
          <span className="text-3xl">🏆</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Bienvenido al modo competitivo</h1>
        <p className="text-blue-100 text-sm">
          Tu camino hacia un mejor padel empieza acá
        </p>
      </div>

      {/* Benefits */}
      <div className="flex-1 px-6 py-6 space-y-5">
        {BENEFITS.map((benefit) => (
          <div key={benefit.title} className="flex gap-4 items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl">
              {benefit.icon}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">{benefit.title}</h3>
              <p className="text-slate-500 text-sm mt-0.5">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-8">
        <Button size="lg" fullWidth onClick={onNext}>
          Empezar
        </Button>
        <p className="text-center text-xs text-slate-400 mt-3">
          Toma menos de 2 minutos
        </p>
      </div>
    </div>
  );
}
