import { Redis } from '@upstash/redis';

/**
 * IP ベースの固定ウィンドウ・レート制限。
 *
 * Upstash Redis が設定されていれば Redis でカウントする（複数インスタンスでも
 * 上限が共有される）。未設定・障害時はインスタンス内メモリにフォールバックする
 * （その場合、水平スケール時は実効上限がインスタンス数倍に緩む）。
 *
 * Edge Runtime（middleware）から使う前提のため、@upstash/redis の
 * REST クライアントのみに依存する。
 */

const WINDOW_MS = 60_000; // 1分間のウィンドウ
const MAX_REQUESTS = 60;  // 1分あたり最大60リクエスト/IP

export interface RateLimitResult {
  limited: boolean;
  count: number;
  limit: number;
  resetAt: number; // ウィンドウのリセット時刻 [epoch ms]
}

let redisInstance: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisInstance !== undefined) return redisInstance;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  redisInstance = url && token ? new Redis({ url, token }) : null;
  return redisInstance;
}

// ---- インメモリ・フォールバック ----

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function checkInMemory(ip: string, now: number): RateLimitResult {
  const prev = memoryStore.get(ip);
  if (!prev || now > prev.resetAt) {
    memoryStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { limited: false, count: 1, limit: MAX_REQUESTS, resetAt: now + WINDOW_MS };
  }
  const count = prev.count + 1;
  memoryStore.set(ip, { count, resetAt: prev.resetAt });
  return { limited: count > MAX_REQUESTS, count, limit: MAX_REQUESTS, resetAt: prev.resetAt };
}

// ---- Redis（固定ウィンドウ: INCR + EXPIRE） ----

async function checkWithRedis(redis: Redis, ip: string, now: number): Promise<RateLimitResult> {
  const windowIndex = Math.floor(now / WINDOW_MS);
  const resetAt = (windowIndex + 1) * WINDOW_MS;
  const key = `ratelimit:v1:${windowIndex}:${ip}`;

  // INCR と EXPIRE を 1 往復にまとめる。EXPIRE は毎回呼んでも、キーが
  // ウィンドウごとに変わるため実害はない（ゴミ掃除の TTL を張り直すだけ）。
  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, Math.ceil((WINDOW_MS * 2) / 1000));
  const [count] = await pipeline.exec<[number, number]>();

  return { limited: count > MAX_REQUESTS, count, limit: MAX_REQUESTS, resetAt };
}

/** レート制限を判定する。Redis 障害時はインメモリに自動フォールバック。 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const now = Date.now();
  const redis = getRedis();
  if (redis) {
    try {
      return await checkWithRedis(redis, ip, now);
    } catch {
      // Redis 障害でリクエストを落とさない。フォールバックで制限は継続する。
    }
  }
  return checkInMemory(ip, now);
}
