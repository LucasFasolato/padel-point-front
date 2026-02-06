'use client';

import { useQuery } from '@tanstack/react-query';
import  api  from '@/lib/api';

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  role: string;
}

/**
 * Hook para obtener el usuario autenticado actual
 * Ajustá el endpoint según tu implementación real
 */
export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const { data } = await api.get<AuthUser>('/auth/me');
        return data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.response?.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min
    retry: false,
  });

  return {
    user: data || null,
    isLoading,
    isAuthenticated: !!data,
    error,
  };
}

/**
 * Hook para actions de auth (login, logout, etc)
 */
export function useAuthActions() {
  // TODO: implementar login/logout según tu sistema
  
  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    // Guardar token si usás localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return {
    login,
    logout,
  };
}