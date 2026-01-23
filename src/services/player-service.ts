import api from '@/lib/api';
import type { AvailabilitySlot, Club, Court, CreateHoldRequest, HoldReservationResponse, MediaAsset, PublicClubOverview, Reservation } from '@/types';

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

  // COURTS (tu versión actual está ok, pero ojo N+1; lo dejamos para después)
  getCourts: async (clubId: string): Promise<Court[]> => {
    const { data } = await api.get<Court[]>(`/public/courts/club/${clubId}`);

    const courtsWithImages = await Promise.all(
      data.map(async (court) => {
        try {
          const imgRes = await api.get<MediaAsset>(`/public/media/courts/${court.id}/primary`);
          return { ...court, primaryImage: imgRes.data };
        } catch {
          return court;
        }
      })
    );

    return courtsWithImages;
  },

  getAvailability: async (courtId: string, date: string): Promise<AvailabilitySlot[]> => {
    const { data } = await api.get<AvailabilitySlot[]>('/availability/slots', {
      params: { courtId, from: date, to: date },
    });
    return data;
  },

  createHold: async (payload: CreateHoldRequest): Promise<HoldReservationResponse> => {
    const { data } = await api.post<HoldReservationResponse>('/reservations/hold', payload);
    return data;
  },
};
