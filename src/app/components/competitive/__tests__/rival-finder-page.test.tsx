import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RivalItem } from '@/services/competitive-service';

const mockBack = vi.fn();
const mockPush = vi.fn();
const mockUseRivalSuggestions = vi.fn();
const mockUseCreateDirectChallenge = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useSearchParams: () => mockUseSearchParams(),
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

function makeEmptyQuery(overrides = {}) {
  return {
    data: { items: [], pages: [], pageParams: [], nextCursor: null },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
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

    // Default: empty URL search params (all defaults: range=100, sameCategory=true)
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

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

  // ─── Existing core rendering tests ───────────────────────────────────────────

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

  it('renders rival cards when data is available', () => {
    render(<RivalFinderPage />);
    expect(screen.getByText('Rival Uno')).toBeInTheDocument();
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

  it('clicking Cargar más calls fetchNextPage', () => {
    mockUseRivalSuggestions.mockReturnValue({
      data: { items: [makeRival()], pages: [], pageParams: [], nextCursor: 'cursor-abc' },
      isLoading: false,
      isError: false,
      refetch,
      hasNextPage: true,
      isFetchingNextPage: false,
      fetchNextPage,
    });

    render(<RivalFinderPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Cargar más sugerencias' }));
    expect(fetchNextPage).toHaveBeenCalled();
  });

  // ─── URL param persistence ────────────────────────────────────────────────────

  describe('URL param persistence', () => {
    it('initializes range select from URL param', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('range=150'));
      mockUseRivalSuggestions.mockReturnValue({
        data: { items: [makeRival()], pages: [], pageParams: [], nextCursor: null },
        isLoading: false,
        isError: false,
        refetch,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage,
      });

      render(<RivalFinderPage />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('150');
    });

    it('initializes sameCategory checkbox as unchecked from URL param', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('sameCategory=false'));
      render(<RivalFinderPage />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('passes parsed URL params to useRivalSuggestions', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('range=200&sameCategory=false'));
      render(<RivalFinderPage />);
      expect(mockUseRivalSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({ range: 200, sameCategory: false }),
      );
    });

    it('falls back to defaults for invalid range param', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('range=999'));
      render(<RivalFinderPage />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('100');
    });
  });

  // ─── Aplicar button updates URL ───────────────────────────────────────────────

  describe('Aplicar button pushes to URL', () => {
    it('changes range and clicking Aplicar calls router.push with range param', () => {
      render(<RivalFinderPage />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: '150' } });
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

      expect(mockPush).toHaveBeenCalledWith('/competitive/find?range=150');
    });

    it('unchecking sameCategory and clicking Aplicar pushes sameCategory=false', () => {
      render(<RivalFinderPage />);

      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

      expect(mockPush).toHaveBeenCalledWith('/competitive/find?sameCategory=false');
    });

    it('clicking Limpiar filtros pushes to /competitive/find with no params', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('range=200&sameCategory=false'));
      render(<RivalFinderPage />);

      fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

      expect(mockPush).toHaveBeenCalledWith('/competitive/find');
    });

    it('Aplicar with default values pushes to /competitive/find with no params', () => {
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
      expect(mockPush).toHaveBeenCalledWith('/competitive/find');
    });
  });

  // ─── Actionable empty states ──────────────────────────────────────────────────

  describe('actionable empty states', () => {
    it('shows "Desactivar misma categoría" button when sameCategory=true and empty', () => {
      // default searchParams → sameCategory=true
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQuery());
      render(<RivalFinderPage />);

      expect(screen.getByTestId('empty-disable-same-category')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Desactivar "misma categoría"' }),
      ).toBeInTheDocument();
    });

    it('clicking "Desactivar misma categoría" calls router.push with sameCategory=false', () => {
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQuery());
      render(<RivalFinderPage />);

      fireEvent.click(screen.getByTestId('empty-disable-same-category'));

      expect(mockPush).toHaveBeenCalledWith('/competitive/find?sameCategory=false');
    });

    it('does NOT show "Desactivar misma categoría" when sameCategory=false', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('sameCategory=false'));
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQuery());
      render(<RivalFinderPage />);

      expect(screen.queryByTestId('empty-disable-same-category')).not.toBeInTheDocument();
    });

    it('shows "Ampliar rango a ±150" button when range=100 and empty', () => {
      // default searchParams → range=100
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQuery());
      render(<RivalFinderPage />);

      expect(screen.getByTestId('empty-increase-range')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ampliar rango a ±150' })).toBeInTheDocument();
    });

    it('clicking "Ampliar rango a ±150" calls router.push with range=150', () => {
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQuery());
      render(<RivalFinderPage />);

      fireEvent.click(screen.getByTestId('empty-increase-range'));

      expect(mockPush).toHaveBeenCalledWith('/competitive/find?range=150');
    });

    it('shows "Ampliar rango a ±200" when range=150 and empty', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('range=150'));
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQuery());
      render(<RivalFinderPage />);

      expect(screen.getByRole('button', { name: 'Ampliar rango a ±200' })).toBeInTheDocument();
    });

    it('does NOT show range increase button when range=200 and empty', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('range=200'));
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQuery());
      render(<RivalFinderPage />);

      expect(screen.queryByTestId('empty-increase-range')).not.toBeInTheDocument();
    });

    it('shows "Limpiar ubicación" button when city is set and empty', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('city=Cordoba'));
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQuery());
      render(<RivalFinderPage />);

      expect(screen.getByTestId('empty-clear-location')).toBeInTheDocument();
    });

    it('clicking "Limpiar ubicación" pushes URL without location params', () => {
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams('city=Cordoba&province=Cordoba&country=Argentina'),
      );
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQuery());
      render(<RivalFinderPage />);

      fireEvent.click(screen.getByTestId('empty-clear-location'));

      // sameCategory=true (default, omitted) and range=100 (default, omitted)
      expect(mockPush).toHaveBeenCalledWith('/competitive/find');
    });

    it('does NOT show empty state CTAs during loading', () => {
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

      expect(screen.queryByTestId('empty-disable-same-category')).not.toBeInTheDocument();
    });
  });

  // ─── Collapsible location section ────────────────────────────────────────────

  describe('collapsible location section', () => {
    it('location fields are hidden by default when no location params in URL', () => {
      render(<RivalFinderPage />);
      expect(screen.queryByPlaceholderText('Ej: Córdoba')).not.toBeInTheDocument();
    });

    it('clicking Ubicación toggle reveals location fields', () => {
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByRole('button', { name: /Ubicación/i }));
      expect(screen.getAllByPlaceholderText('Ej: Córdoba').length).toBeGreaterThan(0);
    });

    it('location fields are visible by default when URL has location params', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('city=Rosario'));
      render(<RivalFinderPage />);
      expect(screen.getAllByPlaceholderText('Ej: Córdoba').length).toBeGreaterThan(0);
    });
  });
});
