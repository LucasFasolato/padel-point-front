import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RivalCard } from '../rival-card';
import type { RivalItem } from '@/services/competitive-service';

function makeRival(overrides: Partial<RivalItem> = {}): RivalItem {
  return {
    userId: '11111111-1111-4111-8111-111111111111',
    displayName: 'Juan Padel',
    category: 5,
    elo: 1240,
    avatarUrl: null,
    matches30d: 8,
    momentum30d: 14,
    reasons: ['ELO similar', 'Misma categoría', 'Activo recientemente'],
    tags: ['aggressive', 'net-player', 'tactical', 'consistent'],
    location: {
      city: 'Cordoba',
      province: 'Cordoba',
      country: 'Argentina',
    },
    ...overrides,
  };
}

describe('RivalCard', () => {
  it('renders key fields and tags overflow', () => {
    render(<RivalCard rival={makeRival()} onChallenge={vi.fn()} />);

    expect(screen.getByText('Juan Padel')).toBeInTheDocument();
    expect(screen.getByText('Cat 5')).toBeInTheDocument();
    expect(screen.getByText('ELO 1240')).toBeInTheDocument();
    expect(screen.getByText('Actividad 30d: 8')).toBeInTheDocument();
    expect(screen.getByText(/Momentum: \+14/)).toBeInTheDocument();
    expect(screen.getByText('Cordoba, Cordoba')).toBeInTheDocument();
    expect(screen.getByText('aggressive')).toBeInTheDocument();
    expect(screen.getByText('net-player')).toBeInTheDocument();
    expect(screen.getByText('tactical')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(
      screen.getByText('ELO similar · Misma categoría · Activo recientemente')
    ).toBeInTheDocument();
  });

  it('disables CTA and shows sent state', () => {
    render(<RivalCard rival={makeRival()} onChallenge={vi.fn()} sent />);
    expect(screen.getByRole('button', { name: 'Enviado' })).toBeDisabled();
  });

  it('triggers challenge callback', () => {
    const onChallenge = vi.fn();
    const rival = makeRival();

    render(<RivalCard rival={rival} onChallenge={onChallenge} />);
    fireEvent.click(screen.getByRole('button', { name: 'Desafiar' }));

    expect(onChallenge).toHaveBeenCalledWith(rival);
  });
});
