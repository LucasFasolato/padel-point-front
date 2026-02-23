import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LeagueShareCard } from '../league-share-card';
import type { StandingEntry } from '@/types/leagues';

const makeRow = (position: number): StandingEntry => ({
  userId: `u-${position}`,
  displayName: `Jugador ${position}`,
  position,
  points: 20 - position,
  wins: 10 - position,
  losses: position,
  draws: 0,
});

describe('LeagueShareCard', () => {
  it('renders only top 5 standings rows', () => {
    const standings = [1, 2, 3, 4, 5, 6].map(makeRow);

    render(
      <LeagueShareCard
        leagueName="Liga Test"
        standings={standings}
        movement={{}}
        computedAt="2026-02-23T10:00:00.000Z"
      />
    );

    expect(screen.getByText('Jugador 1')).toBeInTheDocument();
    expect(screen.getByText('Jugador 5')).toBeInTheDocument();
    expect(screen.queryByText('Jugador 6')).not.toBeInTheDocument();
  });

  it('shows movement arrows only when movement data is available', () => {
    const standings = [1, 2, 3].map(makeRow);

    const { rerender } = render(
      <LeagueShareCard
        leagueName="Liga Test"
        standings={standings}
        movement={{ 'u-1': -1, 'u-2': 2 }}
        computedAt="2026-02-23T10:00:00.000Z"
      />
    );

    expect(screen.getByTestId('share-movement-u-1')).toHaveTextContent('▲');
    expect(screen.getByTestId('share-movement-u-2')).toHaveTextContent('▼');

    rerender(
      <LeagueShareCard
        leagueName="Liga Test"
        standings={standings}
        movement={{}}
        computedAt="2026-02-23T10:00:00.000Z"
      />
    );

    expect(screen.queryByTestId('share-movement-u-1')).not.toBeInTheDocument();
    expect(screen.queryByText('Mov')).not.toBeInTheDocument();
  });
});
