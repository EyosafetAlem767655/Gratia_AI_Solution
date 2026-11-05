/**
 * Crude in-memory rate limit, keyed by IP.
 *
 * Per-instance memory: it resets on cold start and does not span serverless
 * instances — it will not stop a determined attacker, only casual flooding. A
 * shared store would be the real fix if a route ever gets abused.
 */
export function createRateLimit(maxPerWindow: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return function limited(key: string) {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= maxPerWindow) return true;
    recent.push(now);
    hits.set(key, recent);
    return false;
  };
}

export function ipFrom(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function clientIp(request: Request) {
  return ipFrom(request.headers);
}
