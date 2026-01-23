import axios from 'axios';

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
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default api;
