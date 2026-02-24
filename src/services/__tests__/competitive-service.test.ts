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

describe('competitiveService skill radar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /competitive/profile/me/radar', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        sampleSize: 4,
        matches30d: 6,
        axes: [
          { key: 'consistency', label: 'Consistencia', score: 72, description: 'Sostenes el punto.' },
          { key: 'defense', label: 'Defensa', score: 68, description: 'Recuperas bolas.' },
          { key: 'net', label: 'Red', score: 75, description: 'Presionas adelante.' },
          { key: 'power', label: 'Potencia', score: 61, description: 'Generas velocidad.' },
          { key: 'strategy', label: 'Tactica', score: 70, description: 'Leés el partido.' },
        ],
      },
    });

    await competitiveService.getSkillRadar();

    expect(mockedApi.get).toHaveBeenCalledWith('/competitive/profile/me/radar');
  });
});

describe('competitiveService matchmaking rivals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /competitive/matchmaking/rivals with query params', async () => {
    mockedApi.get.mockResolvedValue({ data: { items: [], nextCursor: null } });

    await competitiveService.getRivalSuggestions({
      limit: 20,
      cursor: 'r-next',
      range: 100,
      sameCategory: true,
      city: 'Cordoba',
      province: 'Cordoba',
      country: 'Argentina',
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/competitive/matchmaking/rivals', {
      params: {
        limit: 20,
        cursor: 'r-next',
        range: 100,
        sameCategory: true,
        city: 'Cordoba',
        province: 'Cordoba',
        country: 'Argentina',
      },
    });
  });

  it('omits undefined query params', async () => {
    mockedApi.get.mockResolvedValue({ data: { items: [], nextCursor: null } });

    await competitiveService.getRivalSuggestions({
      limit: 20,
      sameCategory: true,
      city: undefined,
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/competitive/matchmaking/rivals', {
      params: {
        limit: 20,
        sameCategory: true,
      },
    });
  });
});

describe('competitiveService matchmaking partners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /competitive/matchmaking/partners with query params', async () => {
    mockedApi.get.mockResolvedValue({ data: { items: [], nextCursor: null } });

    await competitiveService.getPartnerSuggestions({
      limit: 20,
      cursor: 'p-next',
      range: 150,
      sameCategory: false,
      city: 'Buenos Aires',
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/competitive/matchmaking/partners', {
      params: {
        limit: 20,
        cursor: 'p-next',
        range: 150,
        sameCategory: false,
        city: 'Buenos Aires',
      },
    });
  });

  it('omits undefined query params', async () => {
    mockedApi.get.mockResolvedValue({ data: { items: [], nextCursor: null } });

    await competitiveService.getPartnerSuggestions({ limit: 20, city: undefined });

    expect(mockedApi.get).toHaveBeenCalledWith('/competitive/matchmaking/partners', {
      params: { limit: 20 },
    });
  });

  it('returns items and nextCursor from the response', async () => {
    const mockPartner = {
      userId: 'abc',
      displayName: 'Jugador Test',
      category: 4,
      elo: 1100,
      avatarUrl: null,
      matches30d: 3,
      momentum30d: 5,
      reasons: ['ELO similar'],
      tags: [],
      location: null,
    };
    mockedApi.get.mockResolvedValue({
      data: { items: [mockPartner], nextCursor: 'cursor-xyz' },
    });

    const result = await competitiveService.getPartnerSuggestions({});

    expect(result.items).toHaveLength(1);
    expect(result.items[0].userId).toBe('abc');
    expect(result.nextCursor).toBe('cursor-xyz');
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
