/**
 * A random 6-digit string for building test-data values (room numbers, prices, subjects) that
 * must not collide across the 3 browser projects running in parallel. `Date.now()` looks unique
 * but isn't safe here — parallel workers start within the same millisecond window and can
 * compute the exact same value, causing one worker's cleanup to delete another worker's data.
 * `Math.random()` is per-process, so it doesn't have that shared-clock problem.
 */
export function uniqueSuffix(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}
