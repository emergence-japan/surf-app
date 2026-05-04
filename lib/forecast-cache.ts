import { Redis } from '@upstash/redis';
import type { SurfPointDetail } from './types';

// Upstash Redis は環境変数 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
// （または KV_REST_API_URL / KV_REST_API_TOKEN）から自動検出する。
// Vercel Marketplace の Redis インテグレーションを入れると自動で注入される。
let redisInstance: Redis | null = null;

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redisInstance = new Redis({ url, token });
  return redisInstance;
}

export type CacheStatus = 'fresh' | 'stale' | 'error';

export interface CachedForecastEntry {
  data: SurfPointDetail;
  fetchedAt: number; // epoch ms
}

const KEY_PREFIX = 'forecast:v1:';
const FRESH_TTL_MS = 60 * 60 * 1000; // 1時間以内なら fresh
const STALE_TTL_SEC = 24 * 60 * 60; // Redis上は24時間保持（fresh外でもstaleとして使う）

function key(spotId: string): string {
  return `${KEY_PREFIX}${spotId}`;
}

export async function readSpotCache(spotId: string): Promise<CachedForecastEntry | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const entry = await redis.get<CachedForecastEntry>(key(spotId));
    return entry ?? null;
  } catch {
    return null;
  }
}

export async function writeSpotCache(spotId: string, data: SurfPointDetail): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const entry: CachedForecastEntry = { data, fetchedAt: Date.now() };
  try {
    await redis.set(key(spotId), entry, { ex: STALE_TTL_SEC });
  } catch {
    // キャッシュ書き込み失敗は致命的ではない
  }
}

export function classifyFreshness(fetchedAt: number): 'fresh' | 'stale' {
  return Date.now() - fetchedAt <= FRESH_TTL_MS ? 'fresh' : 'stale';
}

export function isCacheConfigured(): boolean {
  return getRedis() !== null;
}
