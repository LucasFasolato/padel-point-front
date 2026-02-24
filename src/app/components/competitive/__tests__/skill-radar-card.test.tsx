import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SkillRadarCard } from '../skill-radar-card';
import type { CompetitiveSkillRadarResponse } from '@/services/competitive-service';

vi.mock('react-chartjs-2', () => ({
  Radar: () => <div data-testid="radar-chart-mock" />,
}));

function makeRadar(overrides: Partial<CompetitiveSkillRadarResponse> = {}): CompetitiveSkillRadarResponse {
  return {
    sampleSize: 5,
    matches30d: 8,
    axes: [
      { key: 'consistency', label: 'Consistencia', score: 78, description: 'Mantenes ritmo y errores bajos.' },
      { key: 'defense', label: 'Defensa', score: 70, description: 'Recuperación y globos bajo presión.' },
      { key: 'net', label: 'Juego en red', score: 74, description: 'Presión y definición en la red.' },
      { key: 'power', label: 'Potencia', score: 62, description: 'Velocidad y cierre de puntos.' },
      { key: 'strategy', label: 'Táctica', score: 81, description: 'Selección de golpes y lectura.' },
    ],
    updatedAt: '2026-02-24T20:00:00Z',
    ...overrides,
  };
}

describe('SkillRadarCard', () => {
  it('renders chart, labels and meta values', () => {
    render(<SkillRadarCard radar={makeRadar()} />);

    expect(screen.getByRole('heading', { name: 'Radar' })).toBeInTheDocument();
    expect(screen.getByTestId('skill-radar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('radar-chart-mock')).toBeInTheDocument();
    expect(screen.getByText('Partidos 30d: 8')).toBeInTheDocument();
    expect(screen.getByText('Muestra: 5')).toBeInTheDocument();
    expect(screen.getByText('Consistencia')).toBeInTheDocument();
    expect(screen.getByText('Mantenes ritmo y errores bajos.')).toBeInTheDocument();
  });

  it('shows insufficient sample helper when sampleSize < 3', () => {
    render(<SkillRadarCard radar={makeRadar({ sampleSize: 2, matches30d: 2 })} />);

    expect(
      screen.getByText('Jugá al menos 3 partidos para estadísticas más precisas')
    ).toBeInTheDocument();
    expect(screen.getByTestId('radar-chart-mock')).toBeInTheDocument();
  });

  it('shows empty state when radar is missing', () => {
    render(<SkillRadarCard radar={null} />);

    expect(
      screen.getByText('Todavia no hay datos suficientes para construir tu radar de skills.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Jugá al menos 3 partidos para estadísticas más precisas')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('radar-chart-mock')).not.toBeInTheDocument();
  });
});
