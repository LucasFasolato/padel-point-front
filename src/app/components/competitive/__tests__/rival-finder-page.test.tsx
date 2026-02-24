import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RivalItem } from '@/services/competitive-service';

const mockBack = vi.fn();
const mockPush = vi.fn();
const mockUseRivalSuggestions = vi.fn();
const mockUsePartnerSuggestions = vi.fn();
const mockUseCreateDirectChallenge = vi.fn();
const mockUseFavoriteIds = vi.fn();
const mockUseToggleFavorite = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock('@/hooks/use-rival-suggestions', () => ({
  useRivalSuggestions: (...args: unknown[]) => mockUseRivalSuggestions(...args),
}));

vi.mock('@/hooks/use-partner-suggestions', () => ({
  usePartnerSuggestions: (...args: unknown[]) => mockUsePartnerSuggestions(...args),
}));

vi.mock('@/hooks/use-challenges', () => ({
  useCreateDirectChallenge: () => mockUseCreateDirectChallenge(),
}));

vi.mock('@/hooks/use-favorite-ids', () => ({
  useFavoriteIds: () => mockUseFavoriteIds(),
}));

vi.mock('@/hooks/use-favorites', () => ({
  useToggleFavorite: () => mockUseToggleFavorite(),
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

function makeEmptyQueryResult(overrides = {}) {
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

function makeLoadingQueryResult() {
  return {
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  };
}

describe('RivalFinderPage', () => {
  const mutateAsync = vi.fn();
  const toggleFavoriteMutate = vi.fn();
  const refetch = vi.fn();
  const fetchNextPage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue({});
    refetch.mockResolvedValue({});
    fetchNextPage.mockResolvedValue({});

    // Default: rivals tab, empty URL params
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    mockUseCreateDirectChallenge.mockReturnValue({ mutateAsync, isPending: false });
    mockUseToggleFavorite.mockReturnValue({
      mutate: toggleFavoriteMutate,
      isPending: false,
      variables: undefined,
    });
    mockUseFavoriteIds.mockReturnValue({
      data: { ids: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    mockUseRivalSuggestions.mockReturnValue({
      data: { items: [makeRival()], pages: [], pageParams: [], nextCursor: null },
      isLoading: false,
      isError: false,
      refetch,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage,
    });

    // Partners query returns empty by default (partners tab not active)
    mockUsePartnerSuggestions.mockReturnValue(makeEmptyQueryResult());
  });

  // ─── Core rendering ───────────────────────────────────────────────────────────

  it('renders loading skeletons for rivals tab', () => {
    mockUseRivalSuggestions.mockReturnValue(makeLoadingQueryResult());
    render(<RivalFinderPage />);
    expect(screen.getByTestId('rival-finder-loading')).toBeInTheDocument();
  });

  it('renders rival cards when data is available', () => {
    render(<RivalFinderPage />);
    expect(screen.getByText('Rival Uno')).toBeInTheDocument();
    // Default CTA label is "Desafiar"
    expect(screen.getByRole('button', { name: 'Desafiar' })).toBeInTheDocument();
  });

  it('renders error state and retries on rivals tab', () => {
    mockUseRivalSuggestions.mockReturnValue({
      ...makeEmptyQueryResult({ isError: true, data: undefined }),
      refetch,
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

  it('clicking Cargar más calls fetchNextPage on rivals tab', () => {
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

  // ─── Tab switching ────────────────────────────────────────────────────────────

  it('clicking favorite star calls toggleFavorite mutation', () => {
    render(<RivalFinderPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Guardar jugador' }));

    expect(toggleFavoriteMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        targetUserId: '11111111-1111-4111-8111-111111111111',
        isFavorited: false,
        optimisticItem: expect.objectContaining({
          userId: '11111111-1111-4111-8111-111111111111',
          displayName: 'Rival Uno',
        }),
      }),
    );
  });

  it('renders favorite star as pressed when favorite ids includes rival userId', () => {
    mockUseFavoriteIds.mockReturnValue({
      data: {
        ids: ['11111111-1111-4111-8111-111111111111'],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<RivalFinderPage />);

    expect(screen.getByRole('button', { name: 'Guardar jugador' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  describe('tab switching', () => {
    it('renders Rivales and Compañeros tabs', () => {
      render(<RivalFinderPage />);
      expect(screen.getByTestId('tab-rivals')).toBeInTheDocument();
      expect(screen.getByTestId('tab-partners')).toBeInTheDocument();
    });

    it('Rivales tab is selected by default (no tab param)', () => {
      render(<RivalFinderPage />);
      const rivalsTab = screen.getByTestId('tab-rivals');
      expect(rivalsTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('tab-partners')).toHaveAttribute('aria-selected', 'false');
    });

    it('Compañeros tab is selected when ?tab=partners in URL', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=partners'));
      mockUsePartnerSuggestions.mockReturnValue({
        data: { items: [makeRival({ displayName: 'Compañero Test' })], pages: [], pageParams: [], nextCursor: null },
        isLoading: false,
        isError: false,
        refetch,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage,
      });
      render(<RivalFinderPage />);
      expect(screen.getByTestId('tab-partners')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Compañero Test')).toBeInTheDocument();
    });

    it('clicking Compañeros tab calls router.push with ?tab=partners', () => {
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByTestId('tab-partners'));
      expect(mockPush).toHaveBeenCalledWith('/competitive/find?tab=partners');
    });

    it('clicking Rivales tab from partners clears tab param', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=partners'));
      mockUsePartnerSuggestions.mockReturnValue(makeEmptyQueryResult());
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByTestId('tab-rivals'));
      expect(mockPush).toHaveBeenCalledWith('/competitive/find');
    });

    it('tab switch preserves active filter params', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('range=150'));
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByTestId('tab-partners'));
      expect(mockPush).toHaveBeenCalledWith('/competitive/find?range=150&tab=partners');
    });

    it('rivals tab shows Desafiar CTA', () => {
      render(<RivalFinderPage />);
      expect(screen.getByRole('button', { name: 'Desafiar' })).toBeInTheDocument();
    });

    it('partners tab shows Invitar CTA', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=partners'));
      mockUsePartnerSuggestions.mockReturnValue({
        data: { items: [makeRival({ userId: 'partner-uuid' })], pages: [], pageParams: [], nextCursor: null },
        isLoading: false,
        isError: false,
        refetch,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage,
      });
      render(<RivalFinderPage />);
      expect(screen.getByRole('button', { name: 'Invitar' })).toBeInTheDocument();
    });
  });

  // ─── Partner CTA ──────────────────────────────────────────────────────────────

  describe('partner CTA', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=partners'));
      mockUsePartnerSuggestions.mockReturnValue({
        data: {
          items: [makeRival({ userId: 'partner-uuid-123', displayName: 'Compañero Uno' })],
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

    it('clicking Invitar navigates to challenge creation with partnerUserId', () => {
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Invitar' }));
      expect(mockPush).toHaveBeenCalledWith(
        '/competitive/challenges/new?partnerUserId=partner-uuid-123',
      );
    });

    it('clicking Invitar does NOT call createDirectChallenge.mutateAsync', () => {
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Invitar' }));
      expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('renders loading skeleton on partners tab', () => {
      mockUsePartnerSuggestions.mockReturnValue(makeLoadingQueryResult());
      render(<RivalFinderPage />);
      expect(screen.getByTestId('partner-finder-loading')).toBeInTheDocument();
    });

    it('renders partners empty state', () => {
      mockUsePartnerSuggestions.mockReturnValue(makeEmptyQueryResult());
      render(<RivalFinderPage />);
      expect(screen.getByText('No encontramos compañeros todavía')).toBeInTheDocument();
    });

    it('renders partner error state and retries', () => {
      const partnerRefetch = vi.fn();
      mockUsePartnerSuggestions.mockReturnValue({
        ...makeEmptyQueryResult({ isError: true, data: undefined }),
        refetch: partnerRefetch,
      });
      render(<RivalFinderPage />);
      // Error section heading
      expect(screen.getByText('No pudimos cargar sugerencias')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
      expect(partnerRefetch).toHaveBeenCalled();
    });
  });

  // ─── URL param persistence ────────────────────────────────────────────────────

  describe('URL param persistence', () => {
    it('initializes range select from URL param', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('range=150'));
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
        expect.objectContaining({ enabled: true }),
      );
    });

    it('falls back to defaults for invalid range param', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('range=999'));
      render(<RivalFinderPage />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('100');
    });

    it('rivals query is disabled when partners tab is active', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=partners'));
      mockUsePartnerSuggestions.mockReturnValue(makeEmptyQueryResult());
      render(<RivalFinderPage />);
      expect(mockUseRivalSuggestions).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ enabled: false }),
      );
    });

    it('partners query is disabled when rivals tab is active', () => {
      render(<RivalFinderPage />);
      expect(mockUsePartnerSuggestions).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ enabled: false }),
      );
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

    it('Aplicar on partners tab preserves tab param', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=partners'));
      mockUsePartnerSuggestions.mockReturnValue(makeEmptyQueryResult());
      render(<RivalFinderPage />);
      fireEvent.change(screen.getByRole('combobox'), { target: { value: '150' } });
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
      expect(mockPush).toHaveBeenCalledWith('/competitive/find?range=150&tab=partners');
    });

    it('clicking Limpiar filtros pushes to /competitive/find with no params (rivals tab)', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('range=200&sameCategory=false'));
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
      expect(mockPush).toHaveBeenCalledWith('/competitive/find');
    });

    it('clicking Limpiar filtros keeps tab=partners when on partners tab', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=partners&range=200'));
      mockUsePartnerSuggestions.mockReturnValue(makeEmptyQueryResult());
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
      expect(mockPush).toHaveBeenCalledWith('/competitive/find?tab=partners');
    });
  });

  // ─── Actionable empty states ──────────────────────────────────────────────────

  describe('actionable empty states (rivals)', () => {
    it('shows "Desactivar misma categoría" button when empty with default params', () => {
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQueryResult());
      render(<RivalFinderPage />);
      expect(screen.getByTestId('empty-disable-same-category')).toBeInTheDocument();
    });

    it('clicking "Desactivar misma categoría" pushes sameCategory=false', () => {
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQueryResult());
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByTestId('empty-disable-same-category'));
      expect(mockPush).toHaveBeenCalledWith('/competitive/find?sameCategory=false');
    });

    it('shows "Ampliar rango a ±150" when range=100 and empty', () => {
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQueryResult());
      render(<RivalFinderPage />);
      expect(screen.getByTestId('empty-increase-range')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ampliar rango a ±150' })).toBeInTheDocument();
    });

    it('clicking "Ampliar rango a ±150" pushes range=150', () => {
      mockUseRivalSuggestions.mockReturnValue(makeEmptyQueryResult());
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByTestId('empty-increase-range'));
      expect(mockPush).toHaveBeenCalledWith('/competitive/find?range=150');
    });
  });

  describe('actionable empty states (partners)', () => {
    beforeEach(() => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('tab=partners'));
      mockUsePartnerSuggestions.mockReturnValue(makeEmptyQueryResult());
    });

    it('shows "Desactivar misma categoría" on partners empty state', () => {
      render(<RivalFinderPage />);
      expect(screen.getByTestId('empty-disable-same-category')).toBeInTheDocument();
    });

    it('clicking "Desactivar misma categoría" on partners tab preserves tab param', () => {
      render(<RivalFinderPage />);
      fireEvent.click(screen.getByTestId('empty-disable-same-category'));
      expect(mockPush).toHaveBeenCalledWith('/competitive/find?sameCategory=false&tab=partners');
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
