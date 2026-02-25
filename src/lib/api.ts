import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth-store';

const baseURL = process.env.NEXT_PUBLIC_API_URL || '';

if (!baseURL && typeof window !== 'undefined') {
  console.warn(
    '[PadelPoint] NEXT_PUBLIC_API_URL no esta definido. Axios usara rutas relativas.'
  );
}

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<void> | null = null;
let redirectingToLogin = false;

function getRequestPath(url?: string): string {
  if (!url) return '';

  try {
    const parsed = new URL(
      url,
      baseURL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    );
    return parsed.pathname;
  } catch {
    return url;
  }
}

function shouldSkipRefresh(url?: string): boolean {
  const path = getRequestPath(url);

  return (
    path === '/auth/login' ||
    path === '/auth/register' ||
    path === '/auth/google' ||
    path === '/auth/google/callback' ||
    path === '/auth/apple' ||
    path === '/auth/apple/callback' ||
    path === '/auth/refresh' ||
    path === '/auth/logout' ||
    path.startsWith('/auth/password/')
  );
}

function shouldRedirectToLogin(): boolean {
  if (typeof window === 'undefined') return false;

  const path = window.location.pathname;
  return path !== '/login' && path !== '/register';
}

function handleAuthFailure() {
  useAuthStore.getState().clearUser();

  if (shouldRedirectToLogin() && !redirectingToLogin) {
    redirectingToLogin = true;
    window.location.href = '/login?error=session';
  }
}

async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        '/auth/refresh',
        null,
        {
          baseURL,
          withCredentials: true,
          timeout: 15000,
          headers: {
            Accept: 'application/json',
          },
        }
      )
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (shouldSkipRefresh(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      handleAuthFailure();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshSession();
      return api(originalRequest);
    } catch (refreshError) {
      handleAuthFailure();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
