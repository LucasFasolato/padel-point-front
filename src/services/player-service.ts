import api from '@/lib/api';
import type { paths } from '@/api/schema';
import type {
  AvailabilitySlot,
  Club,
  Court,
  CreateHoldRequest,
  HoldReservationResponse,
  MediaAsset,
  PublicClubOverview,
  CheckoutReservation,
} from '@/types';

export type MyPlayerProfileResponse =
  paths['/players/me/profile']['get']['responses'][200]['content']['application/json'];
export type UpdateMyPlayerProfilePayload =
  paths['/players/me/profile']['patch']['requestBody']['content']['application/json'];

export const PlayerService = {
  listClubs: async (): Promise<Club[]> => {
    const { data } = await api.get<Club[]>('/public/clubs');
    return data;
  },

  searchClubs: async (query: string): Promise<Club[]> => {
    const { data } = await api.get<Club[]>('/public/clubs/search', {
      params: { q: query },
    });
    return data;
  },

  getClubOverview: async (clubId: string): Promise<PublicClubOverview> => {
    const { data } = await api.get<PublicClubOverview>(`/public/clubs/${clubId}`);
    return data;
  },

  // COURTS
  getCourts: async (clubId: string): Promise<Court[]> => {
    const { data } = await api.get<Court[]>(`/public/courts/club/${clubId}`);

    const courtsWithImages = await Promise.all(
      data.map(async (court) => {
        try {
          const imgRes = await api.get<MediaAsset>(
            `/public/media/courts/${court.id}/primary`,
          );
          return { ...court, primaryImage: imgRes.data };
        } catch {
          return court;
        }
      }),
    );

    return courtsWithImages;
  },

  getAvailability: async (courtId: string, date: string): Promise<AvailabilitySlot[]> => {
    const { data } = await api.get<AvailabilitySlot[]>('/availability/slots', {
      params: { courtId, from: date, to: date },
    });
    return data;
  },

  // HOLD
  createHold: async (
    payload: CreateHoldRequest,
    signal?: AbortSignal,
  ): Promise<HoldReservationResponse> => {
    const { data } = await api.post<HoldReservationResponse>(
      '/reservations/hold',
      payload,
      signal ? { signal } : undefined,
    );
    return data;
  },

  // CHECKOUT (HOLD) -> requiere checkout token
  getCheckout: async (reservationId: string, token: string): Promise<CheckoutReservation> => {
    const { data } = await api.get<CheckoutReservation>(`/public/reservations/${reservationId}`, {
      params: { token },
    });
    return data;
  },

  // CONFIRM -> body { token }
  confirmCheckout: async (id: string, token: string): Promise<CheckoutReservation> => {
    const { data } = await api.post<CheckoutReservation>(`/public/reservations/${id}/confirm`, {
      token,
    });
    return data;
  },

  // RECEIPT (CONFIRMED) -> requiere receiptToken
  getReceipt: async (reservationId: string, receiptToken: string): Promise<CheckoutReservation> => {
    const { data } = await api.get<CheckoutReservation>(
      `/public/reservations/${reservationId}/receipt`,
      {
        params: { token: receiptToken },
      },
    );
    return data;
  },

  getMyPlayerProfile: async (): Promise<MyPlayerProfileResponse> => {
    const { data } = await api.get<MyPlayerProfileResponse>('/players/me/profile');
    return data;
  },

  updateMyPlayerProfile: async (
    payload: UpdateMyPlayerProfilePayload,
  ): Promise<MyPlayerProfileResponse> => {
    const { data } = await api.patch<MyPlayerProfileResponse>('/players/me/profile', payload);
    return data;
  },

  addFavorite: async (
    targetUserId: paths['/players/me/favorites/{targetUserId}']['post']['parameters']['path']['targetUserId'],
  ): Promise<
    paths['/players/me/favorites/{targetUserId}']['post']['responses'][200]['content']['application/json']
  > => {
    const { data } = await api.post<
      paths['/players/me/favorites/{targetUserId}']['post']['responses'][200]['content']['application/json']
    >(`/players/me/favorites/${targetUserId}`);
    return data;
  },

  removeFavorite: async (
    targetUserId: paths['/players/me/favorites/{targetUserId}']['delete']['parameters']['path']['targetUserId'],
  ): Promise<
    paths['/players/me/favorites/{targetUserId}']['delete']['responses'][200]['content']['application/json']
  > => {
    const { data } = await api.delete<
      paths['/players/me/favorites/{targetUserId}']['delete']['responses'][200]['content']['application/json']
    >(`/players/me/favorites/${targetUserId}`);
    return data;
  },

  listFavorites: async (
    params: NonNullable<paths['/players/me/favorites']['get']['parameters']['query']> = {},
  ): Promise<paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']> => {
    const queryParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined),
    ) as NonNullable<paths['/players/me/favorites']['get']['parameters']['query']>;

    const { data } = await api.get<
      paths['/players/me/favorites']['get']['responses'][200]['content']['application/json']
    >('/players/me/favorites', {
      params: queryParams,
    });
    return data;
  },

  getFavoriteIds: async (): Promise<
    paths['/players/me/favorites/ids']['get']['responses'][200]['content']['application/json']
  > => {
    const { data } = await api.get<
      paths['/players/me/favorites/ids']['get']['responses'][200]['content']['application/json']
    >('/players/me/favorites/ids');
    return data;
  },
};
