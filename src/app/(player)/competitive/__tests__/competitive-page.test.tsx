import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
  usePathname: () => '/competitive',
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: Record<string, unknown>) => <a {...props}>{children}</a>,
}));

vi.mock('@/hooks/use-notifications', () => ({
  useUnreadCount: vi.fn(() => ({ data: 0 })),
}));

vi.mock('@/hooks/use-competitive-profile', () => ({
  useCompetitiveProfile: vi.fn(),
  useEloHistory: vi.fn(),
  useOnboardingState: vi.fn(),
}));

vi.mock('@/hooks/use-matches', () => ({
  useMyMatches: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/app/components/competitive/elo-chart', () => ({
  EloChart: ({ history }: { history: unknown[] }) => (
    history.length === 0 ? (
      <div>Jugá tu primer partido para ver tu evolución</div>
    ) : (
      <div data-testid="elo-chart-mock">chart:{history.length}</div>
    )
  ),
}));

import CompetitivePage from '../page';
import { useCompetitiveProfile, useEloHistory, useOnboardingState } from '@/hooks/use-competitive-profile';

const mockedUseOnboardingState = vi.mocked(useOnboardingState);
const mockedUseCompetitiveProfile = vi.mocked(useCompetitiveProfile);
const mockedUseEloHistory = vi.mocked(useEloHistory);

describe('CompetitivePage onboarding gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseEloHistory.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    } as ReturnType<typeof useEloHistory>);
    mockedUseCompetitiveProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useCompetitiveProfile>);
  });

  it('shows skeleton while onboarding state is loading', () => {
    mockedUseOnboardingState.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useOnboardingState>);

    render(<CompetitivePage />);
    expect(screen.queryByText('Activá tu perfil competitivo')).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to onboarding when onboardingComplete is false', () => {
    mockedUseOnboardingState.mockReturnValue({
      data: { onboardingComplete: false, category: 0, primaryGoal: '', playingFrequency: '', categoryLocked: false },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useOnboardingState>);

    render(<CompetitivePage />);
    expect(mockReplace).toHaveBeenCalledWith('/competitive/onboarding');
  });

  it('renders competitive hub when onboardingComplete is true and profile exists', () => {
    mockedUseOnboardingState.mockReturnValue({
      data: { onboardingComplete: true, category: 5, primaryGoal: 'improve', playingFrequency: 'weekly', categoryLocked: true },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useOnboardingState>);

    mockedUseCompetitiveProfile.mockReturnValue({
      data: {
        id: 'p-1',
        displayName: 'Test Player',
        category: 5,
        elo: 1200,
        wins: 3,
        losses: 1,
        matchesPlayed: 4,
      },
      isLoading: false,
    } as ReturnType<typeof useCompetitiveProfile>);

    render(<CompetitivePage />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('Tu progreso')).toBeInTheDocument();
    expect(screen.getByText('Jugá tu primer partido para ver tu evolución')).toBeInTheDocument();
  });

  it('renders progress chart when elo history data exists', () => {
    mockedUseOnboardingState.mockReturnValue({
      data: { onboardingComplete: true, category: 5, primaryGoal: 'improve', playingFrequency: 'weekly', categoryLocked: true },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useOnboardingState>);

    mockedUseCompetitiveProfile.mockReturnValue({
      data: {
        id: 'p-1',
        displayName: 'Test Player',
        category: 5,
        elo: 1200,
        wins: 3,
        losses: 1,
        matchesPlayed: 4,
      },
      isLoading: false,
    } as ReturnType<typeof useCompetitiveProfile>);

    mockedUseEloHistory.mockReturnValue({
      data: {
        items: [
          {
            id: 'eh-1',
            eloBefore: 1188,
            eloAfter: 1200,
            delta: 12,
            reason: 'match_result',
            refId: 'm-1',
            createdAt: new Date().toISOString(),
          },
        ],
      },
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    } as ReturnType<typeof useEloHistory>);

    render(<CompetitivePage />);

    expect(screen.getByTestId('elo-chart-mock')).toHaveTextContent('chart:1');
    expect(screen.getByText(/Último cambio:/)).toBeInTheDocument();
    expect(screen.getByText(/Resultado de partido/)).toBeInTheDocument();
  });

  it('shows empty state when onboarding errors (graceful fallback)', () => {
    mockedUseOnboardingState.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useOnboardingState>);

    render(<CompetitivePage />);
    // Falls through to profile check → no profile → empty state
    expect(screen.getByText('Activá tu perfil competitivo')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
