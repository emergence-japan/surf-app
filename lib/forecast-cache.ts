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

// v2: daily に period / isBestSwell を追加（ボード切替の週間予報再計算用）
const KEY_PREFIX = 'forecast:v2:';
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

// open-meteo は timezone=Asia/Tokyo で「今日」始まりの daily を返すため、
// キャッシュの新鮮さも JST の暦日で判定する必要がある。
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function jstDayIndex(epochMs: number): number {
  return Math.floor((epochMs + JST_OFFSET_MS) / (24 * 60 * 60 * 1000));
}

export function classifyFreshness(fetchedAt: number, now: number = Date.now()): 'fresh' | 'stale' {
  // JST の日付をまたいだキャッシュは、経過時間が短くても stale として扱う。
  // そうしないと週間予報の先頭に前日が残り続ける（例: 23:30取得 → 翌0:15閲覧）。
  if (jstDayIndex(fetchedAt) !== jstDayIndex(now)) return 'stale';
  return now - fetchedAt <= FRESH_TTL_MS ? 'fresh' : 'stale';
}

export function isCacheConfigured(): boolean {
  return getRedis() !== null;
}
