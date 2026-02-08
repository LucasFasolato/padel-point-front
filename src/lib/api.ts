import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

const baseURL = process.env.NEXT_PUBLIC_API_URL || '';

if (!baseURL && typeof window !== 'undefined') {
  console.warn(
    '[PadelPoint] NEXT_PUBLIC_API_URL no está definido. Axios usará rutas relativas.'
  );
}

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

// Attach JWT solo para endpoints NO públicos
api.interceptors.request.use((config) => {
  const url = config.url ?? '';
  const isPublic = url.startsWith('/public');

  if (!isPublic) {
    const token = useAuthStore.getState().token; 
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Global 401 handler — clears auth and redirects to /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      const url = error.config?.url ?? '';
      const isAuthEndpoint = url.startsWith('/auth/');
      const isAlreadyOnAuth =
        window.location.pathname === '/login' ||
        window.location.pathname === '/register';

      if (!isAuthEndpoint && !isAlreadyOnAuth) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
