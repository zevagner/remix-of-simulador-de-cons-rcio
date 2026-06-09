/**
 * Rate limit em memória por user_id (fallback IP).
 */
const buckets = new Map<string, number[]>();

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

export function checkRateLimit(
  key: string,
  opts: RateLimitOptions = {},
): boolean {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 20;
  const now = Date.now();
  const ts = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (ts.length >= max) {
    buckets.set(key, ts);
    return false;
  }
  ts.push(now);
  buckets.set(key, ts);
  return true;
}

export function getRateLimitKey(req: Request): string {
  try {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    if (token && token.split(".").length === 3) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.sub) return `u:${payload.sub}`;
    }
  } catch {
    /* fall through */
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `ip:${ip}`;
}
