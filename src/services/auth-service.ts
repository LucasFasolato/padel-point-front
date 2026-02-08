import api from '@/lib/api';

export interface LoginResponse {
  accessToken?: string;
  token?: string;
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface RegisterResponse {
  accessToken?: string;
  token?: string;
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  message?: string;
}

export const authService = {
  /** Authenticate an existing user. */
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post('/auth/login-user', { email, password });
    return data;
  },

  /** Register a new user account. */
  async register(name: string, email: string, password: string): Promise<RegisterResponse> {
    const { data } = await api.post('/auth/register-user', { name, email, password });
    return data;
  },
};
