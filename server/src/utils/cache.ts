export const CACHE_TTL_MS = 1000 * 60;
const cache = new Map<string, { expiresAt: number; payload: unknown }>();

export const getCached = <T>(key: string): T | null => {
  const hit = cache.get(key);
  if (!hit || hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.payload as T;
};

export const setCached = (key: string, payload: unknown) => {
  cache.set(key, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
};

export const deleteCached = (key: string) => {
  cache.delete(key);
};

export const deleteCachedByPrefix = (prefix: string) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
};
