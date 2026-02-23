import type { LeagueMatchSet } from '@/types/leagues';

export type LeagueMatchResultPayloadErrorCode =
  | 'INVALID_PLAYED_AT'
  | 'INVALID_SETS_LENGTH'
  | 'INVALID_SET_SCORE';

export class LeagueMatchResultPayloadError extends Error {
  readonly code: LeagueMatchResultPayloadErrorCode;

  constructor(code: LeagueMatchResultPayloadErrorCode, message: string) {
    super(message);
    this.name = 'LeagueMatchResultPayloadError';
    this.code = code;
  }
}

export interface BuildLeagueMatchResultPayloadInput {
  playedAt: Date | string;
  sets: Array<{ a: number; b: number }>;
}

export interface LeagueMatchResultRequestPayload {
  playedAt: string;
  score: { sets: LeagueMatchSet[] };
}

function toIsoString(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new LeagueMatchResultPayloadError(
      'INVALID_PLAYED_AT',
      'playedAt must be a valid date'
    );
  }
  return date.toISOString();
}

function validateSets(sets: Array<{ a: number; b: number }>): LeagueMatchSet[] {
  if (!Array.isArray(sets) || sets.length < 2 || sets.length > 3) {
    throw new LeagueMatchResultPayloadError(
      'INVALID_SETS_LENGTH',
      'sets length must be between 2 and 3'
    );
  }

  return sets.map((set, index) => {
    const a = Number(set?.a);
    const b = Number(set?.b);
    const validA = Number.isInteger(a) && a >= 0 && a <= 7;
    const validB = Number.isInteger(b) && b >= 0 && b <= 7;

    if (!validA || !validB) {
      throw new LeagueMatchResultPayloadError(
        'INVALID_SET_SCORE',
        `set ${index} scores must be integers between 0 and 7`
      );
    }

    return { a, b };
  });
}

export function buildLeagueMatchResultPayload(
  input: BuildLeagueMatchResultPayloadInput
): LeagueMatchResultRequestPayload {
  return {
    playedAt: toIsoString(input.playedAt),
    score: {
      sets: validateSets(input.sets),
    },
  };
}

