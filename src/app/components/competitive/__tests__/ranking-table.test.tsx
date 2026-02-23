import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RankingTable } from '../ranking-table';
import type { RankingEntry } from '@/types/competitive';

const players: RankingEntry[] = [
  {
    userId: 'u-1',
    email: 'uno@test.com',
    displayName: 'Jugador Uno',
    position: 1,
    positionDelta: 2,
    elo: 1400,
    category: 3,
    matchesPlayed: 10,
    wins: 8,
    losses: 2,
    draws: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'u-2',
    email: 'dos@test.com',
    displayName: 'Jugador Dos',
    position: 2,
    positionDelta: null,
    elo: 1350,
    category: 4,
    matchesPlayed: 9,
    wins: 6,
    losses: 3,
    draws: 0,
    updatedAt: new Date().toISOString(),
  },
];

describe('RankingTable', () => {
  it('highlights the current user row and shows Vos badge', () => {
    render(<RankingTable players={players} currentUserId="u-1" />);

    const currentRow = screen.getByText('Jugador Uno').closest('tr');
    expect(currentRow).toHaveAttribute('data-current-user-row', 'true');
    expect(currentRow).toHaveClass('bg-blue-50/70');
    expect(screen.getByText('Vos')).toBeInTheDocument();
  });
});
