import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SkillRadarCard } from '../skill-radar-card';
import type { CompetitiveSkillRadarResponse } from '@/services/competitive-service';

vi.mock('react-chartjs-2', () => ({
  Radar: () => <div data-testid="radar-chart-mock" />,
}));

function makeRadar(overrides: Partial<CompetitiveSkillRadarResponse> = {}): CompetitiveSkillRadarResponse {
  return {
    activity: 72,
    momentum: 65,
    consistency: 78,
    dominance: 68,
    resilience: 70,
    meta: {
      computedAt: '2026-02-24T20:00:00Z',
      matches30d: 8,
      sampleSize: 5,
    },
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
    // Derived axis labels
    expect(screen.getByText('Consistencia')).toBeInTheDocument();
    expect(screen.getByText('Actividad')).toBeInTheDocument();
    expect(screen.getByText('Momentum')).toBeInTheDocument();
    expect(screen.getByText('Dominio')).toBeInTheDocument();
    expect(screen.getByText('Resiliencia')).toBeInTheDocument();
  });

  it('shows insufficient sample helper when meta.sampleSize < 3', () => {
    render(
      <SkillRadarCard
        radar={makeRadar({ meta: { sampleSize: 2, matches30d: 2, computedAt: '2026-02-24T20:00:00Z' } })}
      />,
    );

    expect(
      screen.getByText('Jugá al menos 3 partidos para estadísticas más precisas'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('radar-chart-mock')).toBeInTheDocument();
  });

  it('shows empty state when radar is missing', () => {
    render(<SkillRadarCard radar={null} />);

    expect(
      screen.getByText('Todavia no hay datos suficientes para construir tu radar de skills.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Jugá al menos 3 partidos para estadísticas más precisas'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('radar-chart-mock')).not.toBeInTheDocument();
  });
});
