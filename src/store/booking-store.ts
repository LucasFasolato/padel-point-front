import { create } from 'zustand';
import type { Club, Court, AvailabilitySlot, CreateHoldRequest, HoldReservationResponse } from '@/types';

type HoldState = 'idle' | 'creating' | 'held' | 'expired' | 'error';

function slotToIso(selectedDate: Date, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(selectedDate);
  d.setHours(h, m, 0, 0);
  return d.toISOString(); // UTC ISO (OK con Luxon TZ en back)
}

interface BookingState {
  // Data
  club: Club | null;
  court: Court | null;
  selectedDate: Date;
  selectedSlot: AvailabilitySlot | null;
  availabilityByCourt: Record<string, AvailabilitySlot[]>;

  // Hold flow
  hold: HoldReservationResponse | null;
  holdState: HoldState;
  holdError: string | null;

  // UI
  isDrawerOpen: boolean;

  // Actions
  setClub: (club: Club) => void;
  setCourt: (court: Court) => void;
  setDate: (date: Date) => void;
  setSelectedSlot: (slot: AvailabilitySlot | null) => void;
  setAvailabilityForCourt: (courtId: string, slots: AvailabilitySlot[]) => void;

  openDrawer: () => void;
  closeDrawer: () => void;
  resetFlow: () => void;

  // Hold actions
  setHoldCreating: () => void;
  setHoldSuccess: (hold: HoldReservationResponse) => void;
  setHoldError: (message: string) => void;
  clearHold: () => void;

  // Helpers
  buildHoldPayload: (input: {
    nombre: string;
    email?: string;
    telefono?: string;
    precio: number;
  }) => CreateHoldRequest | null;

  getHoldSecondsLeft: () => number;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  // Initial
  club: null,
  court: null,
  selectedDate: new Date(),
  selectedSlot: null,
  availabilityByCourt: {},

  hold: null,
  holdState: 'idle',
  holdError: null,

  isDrawerOpen: false,

  // Basic setters
  setClub: (club) => set({ club }),
  setCourt: (court) => set({ court }),
  setDate: (date) => set({ selectedDate: date }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setAvailabilityForCourt: (courtId, slots) =>
    set((state) => ({
      availabilityByCourt: { ...state.availabilityByCourt, [courtId]: slots },
    })),

  resetFlow: () =>
    set({
      hold: null,
      holdState: 'idle',
      holdError: null,
    }),

  openDrawer: () =>
    set({
      isDrawerOpen: true,
      hold: null,
      holdState: 'idle',
      holdError: null,
    }),

  closeDrawer: () =>
    set({
      isDrawerOpen: false,
      selectedSlot: null,
      hold: null,
      holdState: 'idle',
      holdError: null,
    }),

  // Hold reducers
  setHoldCreating: () => set({ holdState: 'creating', holdError: null }),
  setHoldSuccess: (hold) => set({ hold, holdState: 'held', holdError: null }),
  setHoldError: (message) => set({ holdState: 'error', holdError: message }),
  clearHold: () => set({ hold: null, holdState: 'idle', holdError: null }),

  // Build payload from slot
  buildHoldPayload: ({ nombre, email, telefono, precio }) => {
    const { court, selectedDate, selectedSlot } = get();
    if (!court || !selectedSlot) return null;

    const startAt = slotToIso(selectedDate, selectedSlot.horaInicio);
    const endAt = slotToIso(selectedDate, selectedSlot.horaFin);

    return {
      courtId: court.id,
      startAt,
      endAt,
      clienteNombre: nombre.trim(),
      clienteEmail: email?.trim() ? email.trim() : undefined,
      clienteTelefono: telefono?.trim() ? telefono.trim() : undefined,
      precio,
    };
  },

  // Seconds left for hold
  getHoldSecondsLeft: () => {
    const { hold } = get();
    if (!hold?.expiresAt) return 0;
    const exp = new Date(hold.expiresAt).getTime();
    return Math.max(0, Math.floor((exp - Date.now()) / 1000));
  },
}));
