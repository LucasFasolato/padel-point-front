import { redirect } from 'next/navigation';
import { isUuid } from '@/lib/id-utils';

interface LeagueSettingsRedirectPageProps {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * Deep-link route:
 * /leagues/[id]/settings -> /leagues/[id]?tab=ajustes
 *
 * Redirects on the server so direct refresh works without client-only effects.
 */
export default function LeagueSettingsRedirectPage({
  params,
  searchParams,
}: LeagueSettingsRedirectPageProps) {
  const { id } = params;
  if (!isUuid(id)) {
    redirect('/leagues');
  }

  const rawSearchParams = searchParams ?? {};
  const nextSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(rawSearchParams)) {
    if (key === 'tab') continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        nextSearchParams.append(key, entry);
      }
      continue;
    }
    if (typeof value === 'string') {
      nextSearchParams.set(key, value);
    }
  }

  nextSearchParams.set('tab', 'ajustes');
  redirect(`/leagues/${id}?${nextSearchParams.toString()}`);
}
