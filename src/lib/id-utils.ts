const UUID_V4_OR_ANY_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates UUID strings used for backend entity IDs.
 */
export function isUuid(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false;
  return UUID_V4_OR_ANY_REGEX.test(value);
}

/**
 * Returns a single route param from Next.js dynamic segments.
 */
export function getSingleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return typeof value === 'string' ? value : null;
}
