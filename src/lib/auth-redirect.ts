import axios from 'axios';
import api from '@/lib/api';

/**
 * After a successful authentication, determine where to send the user.
 * - 409 CITY_REQUIRED → /competitive/onboarding (profile setup required)
 * - anything else    → /competitive (default, fail-open)
 */
export async function getPostAuthDestination(): Promise<string> {
  try {
    await api.get('/competitive/me');
    return '/competitive';
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 409) {
      const code = (err.response.data as { code?: string } | undefined)?.code;
      if (code === 'CITY_REQUIRED') {
        return '/competitive/onboarding';
      }
    }
    // Fail open: network errors, 500s, etc. → go to /competitive anyway
    return '/competitive';
  }
}
