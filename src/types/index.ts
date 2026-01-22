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
  // Computed fields (fetched via separate endpoints or overview)
  logo?: MediaAsset;
  cover?: MediaAsset;
}

export interface Court {
  id: string;
  nombre: string;
  superficie: string;
  precioPorHora: number; // Decimal string from DB, number in JS
  activa: boolean;
  clubId: string; // Relation
  // Computed fields
  primaryImage?: MediaAsset;
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
  courtId: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  available: boolean;
  price?: number;    // Calculated price for this specific slot
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

export interface CheckoutReservation extends Reservation {
  court: Court & {
    club: Club;
  };
}