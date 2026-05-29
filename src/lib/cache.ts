const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function getCache(key: string): any | null {
  try {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache(key: string, data: any): void {
  try {
    cache.set(key, { timestamp: Date.now(), data });
  } catch {}
}
