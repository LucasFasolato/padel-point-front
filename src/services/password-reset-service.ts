import api from '@/lib/api';

export async function requestReset(email: string): Promise<void> {
  await api.post('/auth/password/reset/request', { email });
}

export async function confirmReset(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/password/reset/confirm', { token, newPassword });
}
