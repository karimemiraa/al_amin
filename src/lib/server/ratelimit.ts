/** Small in-memory sliding-window rate limiter (single server process). */
const buckets = new Map<string, number[]>();

/** Records a hit and returns true if `key` exceeded `max` hits within `windowMs`. */
export function rateLimited(bucket: string, key: string, max: number, windowMs: number) {
  const id = `${bucket}:${key}`;
  const now = Date.now();
  const recent = (buckets.get(id) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  buckets.set(id, recent);
  if (buckets.size > 20_000) buckets.clear(); // memory bound under attack
  return recent.length > max;
}
