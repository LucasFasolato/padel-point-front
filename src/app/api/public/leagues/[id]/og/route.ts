import { createElement } from 'react';
import { ImageResponse } from 'next/og';
import { fetchPublicLeagueOg, formatShareComputedAt } from '@/lib/public-league-share';
import {
  LeagueShareOgImage,
  LeagueShareOgImageFallback,
} from './og-image-template';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await Promise.resolve(context.params);
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') ?? '';

  try {
    const data = await fetchPublicLeagueOg(id, token);
    return new ImageResponse(
      createElement(LeagueShareOgImage, {
        leagueName: data.leagueName,
        topFive: data.rows.slice(0, 5),
        computedAt: formatShareComputedAt(data.computedAt),
      }),
      { width: size.width, height: size.height }
    );
  } catch {
    return new ImageResponse(createElement(LeagueShareOgImageFallback), {
      width: size.width,
      height: size.height,
    });
  }
}
