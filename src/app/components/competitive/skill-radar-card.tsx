'use client';

import '@/lib/chart-config';
import { Radar } from 'react-chartjs-2';
import type { CompetitiveSkillRadarResponse } from '@/services/competitive-service';

interface SkillRadarCardProps {
  radar: CompetitiveSkillRadarResponse | null | undefined;
  className?: string;
}

export function SkillRadarCard({ radar, className }: SkillRadarCardProps) {
  const axes = radar?.axes ?? [];
  const hasAxes = axes.length > 0;
  const sampleSize = radar?.sampleSize ?? 0;
  const matches30d = radar?.matches30d ?? 0;
  const insufficientSample = sampleSize < 3;

  if (!radar || !hasAxes) {
    return (
      <section className={className} aria-labelledby="skill-radar-title">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 id="skill-radar-title" className="text-lg font-semibold text-slate-900">
            Radar
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Todavia no hay datos suficientes para construir tu radar de skills.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Jugá al menos 3 partidos para estadísticas más precisas
          </p>
        </div>
      </section>
    );
  }

  const chartData = {
    labels: axes.map((axis) => axis.label),
    datasets: [
      {
        label: 'Skill score',
        data: axes.map((axis) => axis.score),
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
            weight: '600',
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
          label: (context: any) => `${context.label}: ${context.formattedValue}`,
        },
      },
    },
  };

  return (
    <section className={className} aria-labelledby="skill-radar-title">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="skill-radar-title" className="text-lg font-semibold text-slate-900">
              Radar
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Lectura rápida de fortalezas relativas sobre tus últimos partidos competitivos.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Meta</p>
            <p className="text-sm font-semibold text-slate-900">Partidos 30d: {matches30d}</p>
            <p className="text-xs text-slate-600">Muestra: {sampleSize}</p>
          </div>
        </div>

        {insufficientSample ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Jugá al menos 3 partidos para estadísticas más precisas
          </p>
        ) : null}

        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="h-72 rounded-lg border border-slate-100 bg-slate-50 p-3" data-testid="skill-radar-chart">
            <Radar data={chartData} options={chartOptions} />
          </div>

          <ul className="space-y-2" aria-label="Radar metricas">
            {axes.map((axis) => (
              <li
                key={axis.key}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-900">{axis.label}</span>
                  <span className="text-sm font-semibold text-slate-700">{Math.round(axis.score)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{axis.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default SkillRadarCard;
