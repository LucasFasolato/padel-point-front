import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RivalItem } from '@/services/competitive-service';

const mockBack = vi.fn();
const mockPush = vi.fn();
const mockUseRivalSuggestions = vi.fn();
const mockUseCreateDirectChallenge = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

vi.mock('@/hooks/use-rival-suggestions', () => ({
  useRivalSuggestions: (...args: unknown[]) => mockUseRivalSuggestions(...args),
}));

vi.mock('@/hooks/use-challenges', () => ({
  useCreateDirectChallenge: () => mockUseCreateDirectChallenge(),
}));

import RivalFinderPage from '../rival-finder-page';

function makeRival(overrides: Partial<RivalItem> = {}): RivalItem {
  return {
    userId: '11111111-1111-4111-8111-111111111111',
    displayName: 'Rival Uno',
    category: 5,
    elo: 1208,
    avatarUrl: null,
    matches30d: 6,
    momentum30d: 7,
    reasons: ['ELO similar', 'Misma categoría'],
    tags: ['tactical', 'consistent'],
    location: { city: 'Rosario', province: 'Santa Fe', country: 'Argentina' },
    ...overrides,
  };
}

describe('RivalFinderPage', () => {
  const mutateAsync = vi.fn();
  const refetch = vi.fn();
  const fetchNextPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue({});
    refetch.mockResolvedValue({});
    fetchNextPage.mockResolvedValue({});

    mockUseCreateDirectChallenge.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    mockUseRivalSuggestions.mockReturnValue({
      data: {
        items: [makeRival()],
        pages: [],
        pageParams: [],
        nextCursor: null,
      },
      isLoading: false,
      isError: false,
      refetch,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage,
    });
  });

  it('renders loading skeletons', () => {
    mockUseRivalSuggestions.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage,
    });

    render(<RivalFinderPage />);
    expect(screen.getByTestId('rival-finder-loading')).toBeInTheDocument();
  });

  it('renders empty state tips', () => {
    mockUseRivalSuggestions.mockReturnValue({
      data: { items: [], pages: [], pageParams: [], nextCursor: null },
      isLoading: false,
      isError: false,
      refetch,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage,
    });

    render(<RivalFinderPage />);
    expect(screen.getByText('No encontramos rivales todavía')).toBeInTheDocument();
    expect(screen.getByText('Jugá más partidos para mejorar sugerencias')).toBeInTheDocument();
    expect(screen.getByText('Desactivá “misma categoría”')).toBeInTheDocument();
  });

  it('renders error state and retries', () => {
    mockUseRivalSuggestions.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage,
    });

    render(<RivalFinderPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('clicking Desafiar triggers mutation and marks card as sent', async () => {
    render(<RivalFinderPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Desafiar' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        opponentUserId: '11111111-1111-4111-8111-111111111111',
      });
    });

    expect(screen.getByRole('button', { name: 'Enviado' })).toBeDisabled();
  });
});
