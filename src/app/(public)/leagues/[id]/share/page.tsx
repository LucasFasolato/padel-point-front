import type { Metadata } from 'next';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import Link from 'next/link';
import { LeagueShareCard, StandingsTable } from '@/app/components/leagues';
import { fetchPublicLeagueStandingsShare } from '@/lib/public-league-share';
import { isUuid } from '@/lib/id-utils';

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function getSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const token = getSingleSearchParam(resolvedSearchParams.token);

  const ogImagePath = token
    ? `/api/public/leagues/${id}/og?token=${encodeURIComponent(token)}`
    : undefined;

  if (!isUuid(id) || !token) {
    return {
      title: 'PadelPoint · Tabla de posiciones',
      description: 'Mirá cómo va la liga en PadelPoint',
      openGraph: ogImagePath ? { images: [ogImagePath] } : undefined,
    };
  }

  try {
    const data = await fetchPublicLeagueStandingsShare(id, token);
    const title = `${data.leagueName} · Tabla de posiciones`;
    const description = 'Mirá cómo va la liga en PadelPoint';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: ogImagePath ? [ogImagePath] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ogImagePath ? [ogImagePath] : undefined,
      },
    };
  } catch {
    return {
      title: 'PadelPoint · Tabla de posiciones',
      description: 'Mirá cómo va la liga en PadelPoint',
      openGraph: ogImagePath ? { images: [ogImagePath] } : undefined,
    };
  }
}

export default async function PublicLeagueSharePage({ params, searchParams }: PageProps) {
  const { id } = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const token = getSingleSearchParam(resolvedSearchParams.token);

  if (!isUuid(id) || !token) {
    return (
      <>
        <PublicTopBar title="Tabla compartida" backHref="/" />
        <div className="px-4 py-12">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center">
            <p className="text-sm font-medium text-rose-800">Enlace compartido inválido.</p>
            <p className="mt-1 text-xs text-rose-700">Falta el token o la liga no es válida.</p>
          </div>
        </div>
      </>
    );
  }

  try {
    const data = await fetchPublicLeagueStandingsShare(id, token);

    return (
      <>
        <PublicTopBar title="Tabla compartida" backHref="/" />
        <div className="relative mx-auto max-w-4xl px-4 py-6 space-y-4">
          <div className="pointer-events-none absolute right-4 top-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-200">
            PADELPOINT
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">PadelPoint</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">{data.leagueName}</h1>
            <p className="mt-1 text-sm text-slate-600">Mirá cómo va la liga en PadelPoint</p>
          </div>

          <LeagueShareCard
            leagueName={data.leagueName}
            standings={data.rows}
            movement={data.movement}
            computedAt={data.computedAt}
          />

          <StandingsTable
            standings={data.rows}
            movement={data.movement}
            computedAt={data.computedAt}
          />
        </div>
      </>
    );
  } catch {
    return (
      <>
        <PublicTopBar title="Tabla compartida" backHref="/" />
        <div className="px-4 py-12">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center">
            <p className="text-sm font-medium text-rose-800">No pudimos abrir la tabla compartida.</p>
            <p className="mt-1 text-xs text-rose-700">El enlace puede estar vencido o ser inválido.</p>
            <Link
              href="/leagues"
              className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50"
            >
              Compartí un enlace nuevo
            </Link>
          </div>
        </div>
      </>
    );
  }
}
