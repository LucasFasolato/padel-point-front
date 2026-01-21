export interface Club {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
}

export interface Court {
  id: string;
  nombre: string;
  superficie: string;
  precioPorHora: number;
  activa: boolean;
  primaryPhoto?: { url: string; secureUrl: string };
  club?: Club;
}

export interface Reservation {
  clienteNombre: string;
  clienteEmail: string;
  id: string;
  startAt: string; // ISO String (e.g., "2026-01-20T10:00:00")
  endAt: string;
  precio: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID';
  courtId: string;
  court?: Court;
}

export interface CheckoutReservation {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  expiresAt: string | null;
  precio: number;
  court: {
    id: string;
    nombre: string;
    superficie: string;
    precioPorHora: number;
    club: {
      id: string;
      nombre: string;
    };
  };
  cliente: {
    nombre: string;
    email: string | null;
    telefono: string | null;
  };
  checkoutTokenExpiresAt: string | null;
}