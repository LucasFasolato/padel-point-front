import api from '@/lib/api';
import { getMe } from '@/services/session-service';
import type { User } from '@/store/auth-store';

export interface AuthSessionResponse {
  user: User;
}

export const authService = {
  /** Authenticate an existing user. */
  async login(email: string, password: string): Promise<AuthSessionResponse> {
    await api.post('/auth/login', { email, password });

    try {
      const user = await getMe();
      return { user };
    } catch {
      throw new Error('Iniciaste sesion, pero no pudimos cargar tu perfil. Intenta de nuevo.');
    }
  },

  /** Register a new user account. */
  async register(displayName: string, email: string, password: string): Promise<AuthSessionResponse> {
    await api.post('/auth/register', { displayName, email, password });

    try {
      const user = await getMe();
      return { user };
    } catch {
      throw new Error('La cuenta fue creada, pero no pudimos cargar tu perfil. Intenta de nuevo.');
    }
  },
};
