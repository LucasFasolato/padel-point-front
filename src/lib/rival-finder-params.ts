export type RivalFinderParamState = {
  range: number;
  sameCategory: boolean;
  city: string;
  province: string;
  country: string;
};

export const RIVAL_FINDER_RANGES = [50, 100, 150, 200] as const;
export type RivalFinderRange = (typeof RIVAL_FINDER_RANGES)[number];

export const RIVAL_FINDER_DEFAULTS: RivalFinderParamState = {
  range: 100,
  sameCategory: true,
  city: '',
  province: '',
  country: '',
};

type SearchParamsLike = { get(key: string): string | null };

const VALID_RANGE_SET = new Set<number>(RIVAL_FINDER_RANGES);

/** Parse URL search params into a typed RivalFinderParamState. */
export function parseRivalFinderParams(searchParams: SearchParamsLike): RivalFinderParamState {
  const rawRange = Number(searchParams.get('range'));
  const range = VALID_RANGE_SET.has(rawRange) ? rawRange : RIVAL_FINDER_DEFAULTS.range;

  const sameCategoryRaw = searchParams.get('sameCategory');
  const sameCategory =
    sameCategoryRaw === null ? RIVAL_FINDER_DEFAULTS.sameCategory : sameCategoryRaw !== 'false';

  return {
    range,
    sameCategory,
    city: searchParams.get('city') ?? '',
    province: searchParams.get('province') ?? '',
    country: searchParams.get('country') ?? '',
  };
}

/** Build URLSearchParams from a RivalFinderParamState, omitting default values. */
export function buildSearchParams(params: RivalFinderParamState): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.range !== RIVAL_FINDER_DEFAULTS.range) sp.set('range', String(params.range));
  if (params.sameCategory !== RIVAL_FINDER_DEFAULTS.sameCategory) sp.set('sameCategory', 'false');
  if (params.city.trim()) sp.set('city', params.city.trim());
  if (params.province.trim()) sp.set('province', params.province.trim());
  if (params.country.trim()) sp.set('country', params.country.trim());
  return sp;
}
