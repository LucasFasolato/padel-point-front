import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { paths } from '@/api/schema';
import { PlayerService } from '../player-service';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '@/lib/api';

type ApiMock = {
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

type PlayerProfileResponse =
  paths['/players/me/profile']['get']['responses'][200]['content']['application/json'];
type UpdatePlayerProfileBody =
  paths['/players/me/profile']['patch']['requestBody']['content']['application/json'];

const mockedApi = api as unknown as ApiMock;

describe('PlayerService player profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyPlayerProfile calls GET /players/me/profile', async () => {
    const response: PlayerProfileResponse = {
      playStyleTags: ['Control', 'Volea'],
      bio: 'Juego de tarde.',
      lookingFor: { rival: true, partner: false },
      location: { city: 'Cordoba', province: 'Cordoba', country: 'Argentina' },
      updatedAt: '2026-02-24T10:00:00Z',
    };
    mockedApi.get.mockResolvedValue({ data: response });

    const result = await PlayerService.getMyPlayerProfile();

    expect(mockedApi.get).toHaveBeenCalledWith('/players/me/profile');
    expect(result).toEqual(response);
  });

  it('updateMyPlayerProfile calls PATCH /players/me/profile with canonical payload', async () => {
    const payload: UpdatePlayerProfileBody = {
      playStyleTags: ['Control', 'Tactico'],
      bio: 'Prefiero puntos largos.',
      lookingFor: { rival: true, partner: true },
      location: { city: 'Rosario', province: 'Santa Fe', country: 'Argentina' },
    };

    mockedApi.patch.mockResolvedValue({
      data: {
        ...payload,
        updatedAt: '2026-02-24T11:00:00Z',
      } satisfies PlayerProfileResponse,
    });

    const result = await PlayerService.updateMyPlayerProfile(payload);

    expect(mockedApi.patch).toHaveBeenCalledWith('/players/me/profile', payload);
    expect(result).toMatchObject(payload);
  });
});
