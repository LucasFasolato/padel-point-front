import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { paths } from '@/api/schema';
import { PlayerService } from '../player-service';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '@/lib/api';

type ApiMock = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

type PlayerProfileResponse =
  paths['/players/me/profile']['get']['responses'][200]['content']['application/json'];
type UpdatePlayerProfileBody =
  paths['/players/me/profile']['patch']['requestBody']['content']['application/json'];
type FavoritesListResponse =
  paths['/players/me/favorites']['get']['responses'][200]['content']['application/json'];
type FavoriteIdsResponse =
  paths['/players/me/favorites/ids']['get']['responses'][200]['content']['application/json'];
type FavoriteMutationResponse =
  paths['/players/me/favorites/{targetUserId}']['post']['responses'][200]['content']['application/json'];

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

  it('addFavorite calls POST /players/me/favorites/{targetUserId}', async () => {
    const response: FavoriteMutationResponse = { ok: true };
    mockedApi.post.mockResolvedValue({ data: response });

    const result = await PlayerService.addFavorite('user-123');

    expect(mockedApi.post).toHaveBeenCalledWith('/players/me/favorites/user-123');
    expect(result).toEqual(response);
  });

  it('removeFavorite calls DELETE /players/me/favorites/{targetUserId}', async () => {
    const response: FavoriteMutationResponse = { ok: true };
    mockedApi.delete.mockResolvedValue({ data: response });

    const result = await PlayerService.removeFavorite('user-123');

    expect(mockedApi.delete).toHaveBeenCalledWith('/players/me/favorites/user-123');
    expect(result).toEqual(response);
  });

  it('listFavorites calls GET /players/me/favorites with query params', async () => {
    const response: FavoritesListResponse = {
      items: [
        {
          userId: '11111111-1111-4111-8111-111111111111',
          displayName: 'Favorito Uno',
          avatarUrl: null,
          category: 5,
          elo: 1234,
          createdAt: '2026-02-24T12:00:00Z',
          location: { city: 'Cordoba', province: 'Cordoba', country: 'Argentina' },
        },
      ],
      nextCursor: 'cursor-2',
    };
    mockedApi.get.mockResolvedValue({ data: response });

    const result = await PlayerService.listFavorites({ limit: 20, cursor: 'cursor-1' });

    expect(mockedApi.get).toHaveBeenCalledWith('/players/me/favorites', {
      params: { limit: 20, cursor: 'cursor-1' },
    });
    expect(result).toEqual(response);
  });

  it('getFavoriteIds calls GET /players/me/favorites/ids', async () => {
    const response: FavoriteIdsResponse = {
      ids: [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
      ],
    };
    mockedApi.get.mockResolvedValue({ data: response });

    const result = await PlayerService.getFavoriteIds();

    expect(mockedApi.get).toHaveBeenCalledWith('/players/me/favorites/ids');
    expect(result).toEqual(response);
  });
});
