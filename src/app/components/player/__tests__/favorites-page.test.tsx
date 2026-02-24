import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockBack = vi.fn();
const mockPush = vi.fn();
const mockUseFavorites = vi.fn();
const mockUseCreateDirectChallenge = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

vi.mock('@/hooks/use-favorites', () => ({
  useFavorites: (...args: unknown[]) => mockUseFavorites(...args),
}));

vi.mock('@/hooks/use-challenges', () => ({
  useCreateDirectChallenge: () => mockUseCreateDirectChallenge(),
}));

import FavoritesPage from '../favorites-page';

function makeFavoritesQuery(overrides = {}) {
  return {
    data: {
      pages: [
        {
          items: [],
          nextCursor: null,
        },
      ],
      pageParams: [undefined],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  };
}

function makeFavorite(overrides = {}) {
  return {
    userId: '11111111-1111-4111-8111-111111111111',
    displayName: 'Favorito Uno',
    avatarUrl: null,
    category: 5,
    elo: 1240,
    createdAt: '2026-02-24T12:00:00Z',
    location: { city: 'Rosario', province: 'Santa Fe', country: 'Argentina' },
    ...overrides,
  };
}

describe('FavoritesPage', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseFavorites.mockReturnValue(makeFavoritesQuery());
    mutateAsync.mockResolvedValue({});
    mockUseCreateDirectChallenge.mockReturnValue({ mutateAsync, isPending: false });
  });

  it('renders loading skeletons', () => {
    mockUseFavorites.mockReturnValue(
      makeFavoritesQuery({
        data: undefined,
        isLoading: true,
      }),
    );

    render(<FavoritesPage />);

    expect(screen.getByTestId('favorites-loading')).toBeInTheDocument();
  });

  it('renders empty state with link to matchmaking', () => {
    render(<FavoritesPage />);

    expect(screen.getByText('Todavía no guardaste jugadores')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Buscar rival' })).toHaveAttribute(
      'href',
      '/competitive/find',
    );
  });

  it('renders favorites list and sends direct challenge', async () => {
    mockUseFavorites.mockReturnValue(
      makeFavoritesQuery({
        data: {
          pages: [{ items: [makeFavorite()], nextCursor: null }],
          pageParams: [undefined],
        },
      }),
    );

    render(<FavoritesPage />);

    expect(screen.getByText('Favorito Uno')).toBeInTheDocument();
    expect(screen.getByText('Cat 5')).toBeInTheDocument();
    expect(screen.getByText('ELO 1240')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Desafiar' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        opponentUserId: '11111111-1111-4111-8111-111111111111',
      });
    });

    expect(screen.getByRole('button', { name: 'Enviado' })).toBeDisabled();
  });
});
