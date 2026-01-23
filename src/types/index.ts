// src/types/index.ts

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
  secureUrl: string; // <--- We will use this for display
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

export type PublicCourtCard = {
  id: string;
  nombre: string;
  superficie: string;
  precioPorHora: number;
  activa: boolean;
  primaryPhoto: PublicMedia | null;
};

export type PublicMedia = { url: string; secureUrl: string };

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
  precioPorHora: number; // Decimal string from DB, number in JS
  activa: boolean;
  clubId: string; // Relation
  // Computed fields
  primaryImage?: MediaAsset | PublicMedia;
  club?:Club;
}

export interface Reservation {
  id: string;
  courtId: string;
  court?: Court;
  startAt: string; // ISO Date
  endAt: string;   // ISO Date
  status: ReservationStatus;
  
  // Hold Data
  expiresAt?: string | null;
  checkoutToken?: string | null;
  
  // Client Data (No Auth)
  clienteNombre: string;
  clienteEmail?: string | null;
  clienteTelefono?: string | null;
  
  precio: number;
}

// --- DTOs (Data Transfer Objects for Requests) ---

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

export interface HoldReservationResponse {
  id: string;
  status: ReservationStatus; // 'hold'
  startAt: string; // ISO (JSON)
  endAt: string;   // ISO
  expiresAt: string; // ISO
  precio: number;
  checkoutToken: string;
}

export interface CheckoutReservation extends Reservation {
  court: Court & {
    club: Club;
  };
}