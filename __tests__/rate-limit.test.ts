import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

// テスト環境では Upstash の環境変数が無いため、インメモリ経路を検証する。
// モジュールレベルのストアを共有するので、テストごとに一意な IP を使う。

describe('checkRateLimit（インメモリ・フォールバック）', () => {
  it('上限以内のリクエストは制限されない', async () => {
    const result = await checkRateLimit('10.0.0.1');
    expect(result.limited).toBe(false);
    expect(result.count).toBe(1);
    expect(result.limit).toBe(60);
  });

  it('同一 IP の連続リクエストでカウントが増える', async () => {
    await checkRateLimit('10.0.0.2');
    const second = await checkRateLimit('10.0.0.2');
    expect(second.count).toBe(2);
  });

  it('上限（60回）を超えると制限される', async () => {
    let last = await checkRateLimit('10.0.0.3');
    for (let i = 0; i < 60; i++) {
      last = await checkRateLimit('10.0.0.3');
    }
    expect(last.count).toBe(61);
    expect(last.limited).toBe(true);
  });

  it('IP ごとに独立してカウントされる', async () => {
    await checkRateLimit('10.0.0.4');
    const other = await checkRateLimit('10.0.0.5');
    expect(other.count).toBe(1);
  });

  it('resetAt は未来の時刻を返す', async () => {
    const result = await checkRateLimit('10.0.0.6');
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});
