import { describe, expect, it, vi, beforeEach } from 'vitest';
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
      goal: 'improve',
      frequency: '3-4',
      onboardingComplete: false,
      categoryLocked: false,
    };
    mockedApi.get.mockResolvedValue({ data: mockData });

    const result = await competitiveService.getOnboarding();

    expect(mockedApi.get).toHaveBeenCalledWith('/competitive/onboarding');
    expect(result).toEqual(mockData);
  });

  it('putOnboarding calls PUT /competitive/onboarding with full payload', async () => {
    const payload = { category: 5, goal: 'compete', frequency: '1-2' };
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
    const payload = { category: 3, goal: 'socialize', frequency: '5+' };
    mockedApi.put.mockResolvedValue({ data: { ...payload, onboardingComplete: true, categoryLocked: false } });

    await competitiveService.putOnboarding(payload);

    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(mockedApi.put).toHaveBeenCalledTimes(1);
  });
});
