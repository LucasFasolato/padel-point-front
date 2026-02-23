import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  COMPETITIVE_ELO_HISTORY_DEFAULT_LIMIT,
  COMPETITIVE_RANKING_DEFAULT_LIMIT,
} from '@/lib/competitive-constants';
import { competitiveService } from '../competitive-service';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import api from '@/lib/api';
const mockedApi = vi.mocked(api);

describe('competitiveService onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getOnboarding calls GET /competitive/onboarding', async () => {
    const mockData = {
      category: 5,
      primaryGoal: 'improve',
      playingFrequency: 'weekly',
      onboardingComplete: false,
      categoryLocked: false,
    };
    mockedApi.get.mockResolvedValue({ data: mockData });

    const result = await competitiveService.getOnboarding();

    expect(mockedApi.get).toHaveBeenCalledWith('/competitive/onboarding');
    expect(result).toEqual(mockData);
  });

  it('putOnboarding calls PUT /competitive/onboarding with full payload', async () => {
    const payload = { category: 5, primaryGoal: 'compete', playingFrequency: 'biweekly' };
    const mockResponse = {
      ...payload,
      onboardingComplete: true,
      categoryLocked: false,
    };
    mockedApi.put.mockResolvedValue({ data: mockResponse });

    const result = await competitiveService.putOnboarding(payload);

    expect(mockedApi.put).toHaveBeenCalledWith('/competitive/onboarding', payload);
    expect(result.onboardingComplete).toBe(true);
  });

  it('putOnboarding does NOT call initCategory (legacy endpoint)', async () => {
    const payload = { category: 3, primaryGoal: 'socialize', playingFrequency: 'daily' };
    mockedApi.put.mockResolvedValue({ data: { ...payload, onboardingComplete: true, categoryLocked: false } });

    await competitiveService.putOnboarding(payload);

    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockedApi.put).toHaveBeenCalledTimes(1);
  });
});

describe('competitiveService elo history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes limit and cursor as query params', async () => {
    mockedApi.get.mockResolvedValue({ data: { items: [], nextCursor: null } });

    await competitiveService.getEloHistory({ limit: 20, cursor: 'h-next' });

    expect(mockedApi.get).toHaveBeenCalledWith('/competitive/profile/me/history', {
      params: { limit: 20, cursor: 'h-next' },
    });
  });

  it('uses central default limit when omitted', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });

    await competitiveService.getEloHistory();

    expect(mockedApi.get).toHaveBeenCalledWith('/competitive/profile/me/history', {
      params: { limit: COMPETITIVE_ELO_HISTORY_DEFAULT_LIMIT },
    });
  });
});

describe('competitiveService ranking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes category, limit, and cursor as query params', async () => {
    mockedApi.get.mockResolvedValue({ data: { items: [], nextCursor: null } });

    await competitiveService.getRanking({ category: 3, limit: 20, cursor: 'next-123' });

    expect(mockedApi.get).toHaveBeenCalledWith('/competitive/ranking', {
      params: { category: 3, limit: 20, cursor: 'next-123' },
    });
  });

  it('uses central default limit when omitted', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });

    await competitiveService.getRanking();

    expect(mockedApi.get).toHaveBeenCalledWith('/competitive/ranking', {
      params: { limit: COMPETITIVE_RANKING_DEFAULT_LIMIT },
    });
  });
});
