'use client';

import { Line } from 'react-chartjs-2';
import type { EloHistoryPoint } from '@/types/competitive';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EloChartProps {
  history: EloHistoryPoint[];
  className?: string;
}

export function EloChart({ history, className }: EloChartProps) {
  if (!history || history.length === 0) {
    return (
      <div className={className}>
        <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
          No hay suficiente historial para mostrar
        </div>
      </div>
    );
  }

  // Ordenar por fecha (más antiguo primero)
  const sorted = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const labels = sorted.map((point) =>
    format(new Date(point.createdAt), 'dd MMM', { locale: es })
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'ELO',
        data: sorted.map((point) => point.eloAfter),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(148, 163, 184, 0.3)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => {
            const point = sorted[context.dataIndex];
            return [
              `ELO: ${point.eloAfter}`,
              `Cambio: ${point.delta > 0 ? '+' : ''}${point.delta}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#64748b',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
        },
      },
    },
  };

  return (
    <div className={className}>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}