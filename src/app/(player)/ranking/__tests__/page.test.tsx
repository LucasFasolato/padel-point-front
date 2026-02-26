import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.fn();
const mockUseRankingByCategory = vi.fn();

const authState = {
  user: { userId: 'u-1' },
  token: 'token-1',
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/app/components/public/public-topbar', () => ({
  PublicTopBar: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/app/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => <div data-testid="skeleton" className={className} />,
}));

vi.mock('@/hooks/use-competitive-profile', () => ({
  useRankingByCategory: (...args: unknown[]) => mockUseRankingByCategory(...args),
}));

vi.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}));

import RankingPage from '../page';

function makeRankingQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      items: [
        {
          userId: 'u-1',
          email: 'uno@test.com',
          displayName: 'Jugador Uno',
          position: 1,
          positionDelta: 1,
          elo: 1400,
          category: 3,
          matchesPlayed: 5,
          wins: 4,
          losses: 1,
          draws: 0,
          updatedAt: new Date().toISOString(),
        },
      ],
    },
    isLoading: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
    ...overrides,
  };
}

describe('Ranking Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRankingByCategory.mockReturnValue(makeRankingQuery());
  });

  it('changes category when a tab is selected and refetches with that category key', () => {
    render(<RankingPage />);

    expect(mockUseRankingByCategory).toHaveBeenCalledWith(undefined);

    fireEvent.click(screen.getByRole('tab', { name: 'Cat 3' }));

    expect(mockUseRankingByCategory).toHaveBeenLastCalledWith(3);
  });

  it('shows empty state when ranking has no players', () => {
    mockUseRankingByCategory.mockReturnValue(
      makeRankingQuery({
        data: { items: [] },
      })
    );

    render(<RankingPage />);

    expect(
      screen.getByText('Jug\u00E1 al menos 1 partido confirmado para aparecer en el ranking')
    ).toBeInTheDocument();
  });
});
