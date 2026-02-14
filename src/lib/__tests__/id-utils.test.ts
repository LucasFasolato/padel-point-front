import { describe, expect, it } from 'vitest';
import { getSingleParam, isUuid } from '../id-utils';

describe('isUuid', () => {
  it('returns true for valid uuid', () => {
    expect(isUuid('11111111-1111-4111-8111-111111111111')).toBe(true);
  });

  it('returns false for undefined and invalid strings', () => {
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid('undefined')).toBe(false);
    expect(isUuid('lg-1')).toBe(false);
  });
});

describe('getSingleParam', () => {
  it('extracts first value from array', () => {
    expect(getSingleParam(['a', 'b'])).toBe('a');
  });

  it('returns string value as-is', () => {
    expect(getSingleParam('abc')).toBe('abc');
  });

  it('returns null for missing values', () => {
    expect(getSingleParam(undefined)).toBeNull();
    expect(getSingleParam([])).toBeNull();
  });
});
