// --- ENUMS (Mirroring Backend) ---
export enum ReservationStatus {
  HOLD = 'hold',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum MediaOwnerType {
  CLUB = 'CLUB',
  COURT = 'COURT',
  USER = 'USER',
}

export enum MediaKind {
  CLUB_LOGO = 'CLUB_LOGO',
  CLUB_COVER = 'CLUB_COVER',
  COURT_PRIMARY = 'COURT_PRIMARY',
  COURT_GALLERY = 'COURT_GALLERY',
  USER_AVATAR = 'USER_AVATAR',
}

// --- ENTITIES ---

export interface MediaAsset {
  id: string;
  ownerType: MediaOwnerType;
  ownerId: string;
  kind: MediaKind;
  provider: string; // 'CLOUDINARY'
  publicId: string;
  url: string;
  secureUrl: string;
  width?: number;
  height?: number;
  active: boolean;
}

export interface Club {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  latitud?: number | null;
  longitud?: number | null;

  logo?: MediaAsset;
  cover?: MediaAsset;
}

export type PublicMedia = { url: string; secureUrl: string };

export type PublicCourtCard = {
  id: string;
  nombre: string;
  superficie: string;
  precioPorHora: number;
  activa: boolean;
  primaryPhoto: PublicMedia | null;
};

export type PublicClubOverview = {
  club: {
    id: string;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    latitud: number | null;
    longitud: number | null;
    activo: boolean;
  };
  media: {
    logo: PublicMedia | null;
    cover: PublicMedia | null;
  };
  courts: Array<{
    id: string;
    nombre: string;
    superficie: string;
    precioPorHora: number;
    activa: boolean;
    primaryPhoto: PublicMedia | null;
  }>;
};

export interface Court {
  id: string;
  nombre: string;
  superficie: string;
  precioPorHora: number;
  activa: boolean;
  clubId: string;

  primaryImage?: MediaAsset | PublicMedia;
  club?: Club;
}

export interface Reservation {
  id: string;
  courtId: string;
  court?: Court;
  startAt: string;
  endAt: string;
  status: ReservationStatus;

  expiresAt?: string | null;
  checkoutToken?: string | null;

  clienteNombre: string;
  clienteEmail?: string | null;
  clienteTelefono?: string | null;

  precio: number;
}

// --- DTOs ---

export interface AvailabilitySlot {
  fecha: string;        // "2026-01-23"
  courtId: string;
  courtNombre: string;
  ruleId: string;
  horaInicio: string;   // "09:00"
  horaFin: string;      // "10:30"
  ocupado: boolean;
  estado: 'ocupado' | 'libre';
  motivoBloqueo: string | null;
  reservationId: string | null;
}

export interface CreateHoldRequest {
  courtId: string;
  startAt: string; // ISO 8601
  endAt: string;   // ISO 8601
  clienteNombre: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  precio: number;
}

// Respuesta de POST /reservations/hold
export interface HoldReservationResponse {
  id: string;
  status: ReservationStatus; // hold
  startAt: string;
  endAt: string;
  expiresAt: string | null;    
  precio: number;
  checkoutToken: string;
  serverNow: string;   
}

// Respuesta de GET /public/reservations/:id?token=...
export interface CheckoutReservation {
  id: string;
  status: 'hold' | 'confirmed' | 'cancelled';
  startAt: string;
  endAt: string;
  expiresAt: string | null;
  precio: number;
  checkoutTokenExpiresAt: string | null;

  serverNow: string;

  receiptToken: string | null;
  receiptTokenExpiresAt: string | null;
  
  notifications?: {
    email: { status: 'queued' | 'sent' | 'failed'; sentAt: string } | null;
    whatsapp:
      | { status: 'queued' | 'sent' | 'failed'; sentAt: string; link: string | null }
      | null;
  };

  court: {
    id: string;
    nombre: string;
    superficie: string;
    precioPorHora: number;
    club: {
      id: string;
      nombre: string;
      direccion?: string;
    };
  };

  cliente: {
    nombre: string;
    email: string | null;
    telefono: string | null;
  };
}

export type ReservationNotificationStatus = 'sent' | 'pending' | 'error';

export type ReservationNotificationResponse = {
  status: ReservationNotificationStatus;
  lastAttemptAt: string | null;
  message?: string | null;
};

export type PublicCourt = Omit<Court, 'club' | 'clubId'> & {
  club: Pick<Club, 'id' | 'nombre'>;
};