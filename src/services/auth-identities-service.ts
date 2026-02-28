import api from '@/lib/api';

export type IdentityProvider = 'google' | 'apple' | 'password';

export interface AuthIdentity {
  provider: IdentityProvider;
  email?: string;
  connectedAt?: string;
}

export async function getAuthIdentities(): Promise<AuthIdentity[]> {
  const { data } = await api.get<AuthIdentity[]>('/me/auth-identities');
  return data;
}
