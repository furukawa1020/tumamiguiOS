export const nowMs = (): number => performance.now();

export const hasExpired = (
  atMs: number | null,
  now: number,
  durationMs: number,
): boolean => atMs !== null && now - atMs >= durationMs;
