import { describe, expect, it } from 'vitest';
import type { paths } from '@/api/schema';
import {
  LeagueMatchResultPayloadError,
  buildLeagueMatchResultPayload,
} from '@/lib/matches/build-league-match-result-payload';

type LeagueMatchResultPatchBody =
  paths['/leagues/{leagueId}/matches/{matchId}/result']['patch']['requestBody']['content']['application/json'];

describe('buildLeagueMatchResultPayload', () => {
  it('returns canonical shape with score.sets', () => {
    const result = buildLeagueMatchResultPayload({
      playedAt: '2026-02-23T12:00:00Z',
      sets: [
        { a: 6, b: 4 },
        { a: 6, b: 3 },
      ],
    });
    const body: LeagueMatchResultPatchBody = result;

    expect(body).toEqual({
      playedAt: '2026-02-23T12:00:00.000Z',
      score: {
        sets: [
          { a: 6, b: 4 },
          { a: 6, b: 3 },
        ],
      },
    });
    expect(body).not.toHaveProperty('sets');
  });

  it('rejects invalid sets length', () => {
    expect(() =>
      buildLeagueMatchResultPayload({
        playedAt: '2026-02-23T12:00:00Z',
        sets: [{ a: 6, b: 4 }],
      })
    ).toThrow(LeagueMatchResultPayloadError);

    expect(() =>
      buildLeagueMatchResultPayload({
        playedAt: '2026-02-23T12:00:00Z',
        sets: [
          { a: 6, b: 4 },
          { a: 6, b: 3 },
          { a: 4, b: 6 },
          { a: 1, b: 0 },
        ],
      })
    ).toThrow(LeagueMatchResultPayloadError);
  });

  it('rejects a/b out of range', () => {
    expect(() =>
      buildLeagueMatchResultPayload({
        playedAt: '2026-02-23T12:00:00Z',
        sets: [
          { a: 8, b: 4 },
          { a: 6, b: 3 },
        ],
      })
    ).toThrow(LeagueMatchResultPayloadError);
  });

  it('playedAt is ISO string', () => {
    const playedAt = new Date('2026-02-23T12:34:56-03:00');
    const result = buildLeagueMatchResultPayload({
      playedAt,
      sets: [
        { a: 6, b: 2 },
        { a: 6, b: 1 },
      ],
    });

    expect(result.playedAt).toBe(playedAt.toISOString());
    expect(result.playedAt).toMatch(/Z$/);
  });
});
