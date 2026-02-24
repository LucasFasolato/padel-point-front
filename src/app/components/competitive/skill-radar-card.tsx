'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import '@/lib/chart-config';
import { Radar } from 'react-chartjs-2';
import type { CompetitiveSkillRadarResponse } from '@/services/competitive-service';

interface SkillRadarCardProps {
  radar: CompetitiveSkillRadarResponse | null | undefined;
  className?: string;
}

type DerivedAxis = { key: string; label: string; value: number; description: string };

const AXIS_META: Record<string, { label: string; description: string }> = {
  activity: {
    label: 'Actividad',
    description: 'Qué tan seguido jugás. Más partidos en los últimos 30 días = mayor puntuación.',
  },
  momentum: {
    label: 'Momentum',
    description: 'Tendencia de tus resultados recientes. Una racha positiva sube este valor.',
  },
  consistency: {
    label: 'Consistencia',
    description: 'Qué tan estable es tu nivel. Resultados parejos frente a rivales similares.',
  },
  dominance: {
    label: 'Dominio',
    description: 'Porcentaje de sets ganados. Ganar sets ampliamente sube este eje.',
  },
  resilience: {
    label: 'Resiliencia',
    description: 'Capacidad de recuperarte y ganar partidos después de perder el primer set.',
  },
};

function deriveAxes(radar: CompetitiveSkillRadarResponse): DerivedAxis[] {
  return [
    { key: 'activity', ...AXIS_META.activity, value: radar.activity ?? 50 },
    { key: 'momentum', ...AXIS_META.momentum, value: radar.momentum ?? 50 },
    { key: 'consistency', ...AXIS_META.consistency, value: radar.consistency ?? 50 },
    { key: 'dominance', ...AXIS_META.dominance, value: radar.dominance ?? 50 },
    { key: 'resilience', ...AXIS_META.resilience, value: radar.resilience ?? 50 },
  ];
}

export function SkillRadarCard({ radar, className }: SkillRadarCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const axes: DerivedAxis[] = radar ? deriveAxes(radar) : [];
  const hasAxes = axes.length > 0;
  const sampleSize = radar?.meta?.sampleSize ?? 0;
  const matches30d = radar?.meta?.matches30d ?? 0;
  const insufficientSample = sampleSize < 3;

  if (!radar || !hasAxes) {
    return (
      <section className={className} aria-labelledby="skill-radar-title">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 id="skill-radar-title" className="text-lg font-semibold text-slate-900">
            Radar de juego
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Basado en tus últimos partidos competitivos (últimos 30 días)
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Todavía no hay datos suficientes. Jugá al menos 3 partidos competitivos para ver tu radar.
          </p>
        </div>
      </section>
    );
  }

  const chartData = {
    labels: axes.map((axis) => axis.label),
    datasets: [
      {
        label: 'Tu perfil',
        data: axes.map((axis) => axis.value),
        borderColor: 'rgb(15, 23, 42)',
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        pointBackgroundColor: 'rgb(37, 99, 235)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(37, 99, 235)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          showLabelBackdrop: false,
          color: '#94a3b8',
          backdropColor: 'transparent',
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.22)',
        },
        angleLines: {
          color: 'rgba(148, 163, 184, 0.22)',
        },
        pointLabels: {
          color: '#334155',
          font: {
            size: 12,
            weight: 600,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => `${context.label}: ${context.formattedValue} / 100`,
        },
      },
    },
  };

  return (
    <section className={className} aria-labelledby="skill-radar-title">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 id="skill-radar-title" className="text-lg font-semibold text-slate-900">
                Radar de juego
              </h2>
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                aria-label="¿Qué significa cada eje?"
                title="¿Qué significa cada eje?"
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                {showInfo ? <X size={15} /> : <Info size={15} />}
              </button>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Basado en tus últimos partidos competitivos (30 días)
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-right">
            <p className="text-xs font-semibold text-slate-700">
              {matches30d} partido{matches30d !== 1 ? 's' : ''} (30 días)
            </p>
            <p className="text-xs text-slate-500">Muestra: {sampleSize}</p>
          </div>
        </div>

        {/* Insufficient data warning */}
        {insufficientSample && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Datos insuficientes — jugá al menos 3 partidos para mayor precisión.
          </p>
        )}

        {/* Info panel: axis explanations */}
        {showInfo && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 space-y-2">
            <p className="text-xs font-semibold text-blue-800">¿Qué mide cada eje?</p>
            {axes.map((axis) => (
              <div key={axis.key}>
                <span className="text-xs font-semibold text-slate-700">{axis.label}: </span>
                <span className="text-xs text-slate-600">{axis.description}</span>
              </div>
            ))}
            <p className="text-[10px] text-slate-400 pt-1">
              Todos los valores van de 0 a 100. Se recalculan con cada partido confirmado.
            </p>
          </div>
        )}

        {/* Chart + metrics list */}
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div
            className="h-72 rounded-lg border border-slate-100 bg-slate-50 p-3"
            data-testid="skill-radar-chart"
          >
            <Radar data={chartData} options={chartOptions} />
          </div>

          <ul className="space-y-1.5" aria-label="Métricas del radar">
            {axes.map((axis) => {
              const score = Math.round(axis.value);
              const barWidth = Math.min(100, Math.max(0, score));
              return (
                <li
                  key={axis.key}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-sm font-semibold text-slate-900">{axis.label}</span>
                    <span className="text-sm font-bold text-slate-700">{score}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  {showInfo && (
                    <p className="mt-1 text-[10px] leading-tight text-slate-500">
                      {axis.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default SkillRadarCard;
