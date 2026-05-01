/**
 * 간단한 서버사이드 인메모리 TTL 캐시
 * PM2 재시작 시 초기화됨. 짧은 TTL로 DB 부하 감소용.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

/** prefix로 시작하는 모든 캐시 키 삭제 */
export function cacheDeletePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** 서비스 데이터 변경 시 관련 캐시 전체 무효화 */
export function invalidateServiceCaches(): void {
  cacheDelete('categories:all');
  cacheDelete('services:featured');
  cacheDeletePrefix('search:results:');
}

/**
 * 캐시 래퍼: 캐시 히트 시 바로 반환, 미스 시 fn 실행 후 저장
 */
export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) return cached;
  const value = await fn();
  cacheSet(key, value, ttlMs);
  return value;
}

// TTL 상수 (ms)
export const TTL = {
  CATEGORIES: 5 * 60 * 1000,       // 5분
  FEATURED: 5 * 60 * 1000,          // 5분
  SEARCH_RESULTS: 2 * 60 * 1000,    // 2분
  SERVICE_DETAIL: 10 * 60 * 1000,   // 10분
} as const;
