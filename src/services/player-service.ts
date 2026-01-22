import api from '@/lib/api'; // Your existing Axios instance
import { 
  Club, 
  Court, 
  MediaAsset, 
  MediaKind, 
  MediaOwnerType, 
  AvailabilitySlot, 
  CreateHoldRequest, 
  Reservation 
} from '@/types';

export const PlayerService = {
  
  // --- CLUBS ---
  
  /**
   * GET /public/clubs/:id
   * Fetches the basic club details
   */
  getClub: async (id: string): Promise<Club> => {
    const { data } = await api.get<Club>(`/public/clubs/${id}`);
    return data;
  },

  /**
   * GET /public/media/...
   * Fetches specific branding assets for the club
   */
  getClubAssets: async (clubId: string) => {
    const [logoRes, coverRes] = await Promise.allSettled([
      api.get<MediaAsset>(`/public/media/clubs/${clubId}/logo`),
      api.get<MediaAsset>(`/public/media/clubs/${clubId}/cover`)
    ]);

    return {
      logo: logoRes.status === 'fulfilled' ? logoRes.value.data : null,
      cover: coverRes.status === 'fulfilled' ? coverRes.value.data : null,
    };
  },

  // --- COURTS ---

  /**
   * GET /public/courts/club/:clubId
   * Fetches all courts for the landing page
   */
  getCourts: async (clubId: string): Promise<Court[]> => {
    const { data } = await api.get<Court[]>(`/public/courts/club/${clubId}`);
    
    // Enhancement: Fetch primary images for all courts in parallel
    // This is "World Class" - avoiding N+1 requests in the UI component
    const courtsWithImages = await Promise.all(data.map(async (court) => {
      try {
        const imgRes = await api.get<MediaAsset>(`/public/media/courts/${court.id}/primary`);
        return { ...court, primaryImage: imgRes.data };
      } catch (e) {
        return court; // Return court without image if fail
      }
    }));

    return courtsWithImages;
  },

  // --- AVAILABILITY ---

  /**
   * GET /availability/slots
   * Calculates valid slots based on Rules, Overrides, and Reservations
   */
  getAvailability: async (courtId: string, date: string): Promise<AvailabilitySlot[]> => {
    // AvailabilityRangeQueryDto requires 'from' and 'to'. 
    // For a single day view, from = to = date (YYYY-MM-DD).
    const { data } = await api.get<AvailabilitySlot[]>('/availability/slots', {
      params: {
        courtId,
        from: date,
        to: date
      }
    });
    return data;
  },

  // --- BOOKING (HOLD) ---

  /**
   * POST /reservations/hold
   * Creates a temporary hold on the slot
   */
  createHold: async (payload: CreateHoldRequest): Promise<Reservation> => {
    const { data } = await api.post<Reservation>('/reservations/hold', payload);
    return data;
  },

  searchClubs: async (query: string): Promise<Club[]> => {
    const { data } = await api.get<Club[]>('/public/clubs/search', {
      params: { q: query }
    });
    return data;
  }
};