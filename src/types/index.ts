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
}


export interface Reservation {
  clienteNombre: string;
  clienteEmail: string;
  id: string;
  courtId: string;
  startAt: string; // ISO String (e.g., "2026-01-20T10:00:00")
  endAt: string;
  precio: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID';
  // Include nested relations often returned by the API
  court?: {
    id: string;
    nombre: string;
    club?: {
      nombre: string;
      direccion: string;
    };
  };
}