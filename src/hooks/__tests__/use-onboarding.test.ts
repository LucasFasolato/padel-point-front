import { describe, expect, it } from 'vitest';
import {
  parseOnboardingError,
  CATEGORY_LOCKED_CODE,
} from '@/lib/onboarding-utils';

/**
 * Creates a mock error object that matches the AxiosError shape
 * (duck-typed — parseOnboardingError only checks for .response.status/.data).
 */
function makeResponseError(status: number, data?: Record<string, unknown>) {
  return {
    response: {
      status,
      data: data ?? {},
    },
  };
}

describe('parseOnboardingError', () => {
  it('detects CATEGORY_LOCKED from 409 status', () => {
    const err = makeResponseError(409, { code: 'CATEGORY_LOCKED', message: 'Custom msg' });
    const result = parseOnboardingError(err);
    expect(result.code).toBe(CATEGORY_LOCKED_CODE);
    expect(result.message).toBe('Custom msg');
  });

  it('detects CATEGORY_LOCKED from code field even without 409', () => {
    const err = makeResponseError(400, { code: 'CATEGORY_LOCKED' });
    const result = parseOnboardingError(err);
    expect(result.code).toBe(CATEGORY_LOCKED_CODE);
  });

  it('provides fallback message for CATEGORY_LOCKED without server message', () => {
    const err = makeResponseError(409);
    const result = parseOnboardingError(err);
    expect(result.code).toBe(CATEGORY_LOCKED_CODE);
    expect(result.message).toContain('categoría');
  });

  it('returns VALIDATION_ERROR for 422', () => {
    const err = makeResponseError(422, { message: 'Bad input' });
    const result = parseOnboardingError(err);
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('Bad input');
  });

  it('returns VALIDATION_ERROR for 400 (non-locked)', () => {
    const err = makeResponseError(400, { message: 'Missing field' });
    const result = parseOnboardingError(err);
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('Missing field');
  });

  it('returns generic HTTP error for other status codes', () => {
    const err = makeResponseError(500);
    const result = parseOnboardingError(err);
    expect(result.code).toBe('HTTP_500');
    expect(result.message).toContain('inesperado');
  });

  it('returns NETWORK_ERROR for non-response errors', () => {
    const result = parseOnboardingError(new Error('timeout'));
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.message).toContain('conexión');
  });

  it('returns NETWORK_ERROR for null/undefined', () => {
    expect(parseOnboardingError(null).code).toBe('NETWORK_ERROR');
    expect(parseOnboardingError(undefined).code).toBe('NETWORK_ERROR');
  });
});
