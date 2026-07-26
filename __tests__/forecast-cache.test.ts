import { describe, it, expect } from 'vitest';
import { classifyFreshness } from '@/lib/forecast-cache';

// JST の指定日時を epoch ms に変換する（UTC+9）
function jst(year: number, month: number, day: number, hour: number, minute = 0): number {
  return Date.UTC(year, month - 1, day, hour - 9, minute);
}

describe('classifyFreshness', () => {
  it('1時間以内かつ同じ日なら fresh', () => {
    const fetchedAt = jst(2026, 7, 26, 9, 0);
    const now = jst(2026, 7, 26, 9, 30);
    expect(classifyFreshness(fetchedAt, now)).toBe('fresh');
  });

  it('同じ日でも1時間を超えていれば stale', () => {
    const fetchedAt = jst(2026, 7, 26, 9, 0);
    const now = jst(2026, 7, 26, 11, 0);
    expect(classifyFreshness(fetchedAt, now)).toBe('stale');
  });

  // 週間予報の先頭が前日のまま残る不具合の再発防止。
  // 経過時間が短くても、JST の日付をまたいだら必ず再取得させる。
  it('1時間以内でも JST の日付をまたいでいれば stale', () => {
    const fetchedAt = jst(2026, 7, 25, 23, 30);
    const now = jst(2026, 7, 26, 0, 15);
    expect(classifyFreshness(fetchedAt, now)).toBe('stale');
  });

  it('日付境界の直前（23:59→翌0:00）でも stale', () => {
    const fetchedAt = jst(2026, 7, 25, 23, 59);
    const now = jst(2026, 7, 26, 0, 0);
    expect(classifyFreshness(fetchedAt, now)).toBe('stale');
  });

  it('月をまたぐ場合も stale', () => {
    const fetchedAt = jst(2026, 7, 31, 23, 30);
    const now = jst(2026, 8, 1, 0, 10);
    expect(classifyFreshness(fetchedAt, now)).toBe('stale');
  });

  it('UTC では日付が変わるが JST では同日のケースは fresh のまま', () => {
    // JST 8:30 → UTC 前日 23:30。UTC 基準で判定すると誤って stale になる
    const fetchedAt = jst(2026, 7, 26, 8, 30);
    const now = jst(2026, 7, 26, 9, 0);
    expect(classifyFreshness(fetchedAt, now)).toBe('fresh');
  });

  it('now を省略した場合は現在時刻を使う', () => {
    expect(classifyFreshness(Date.now())).toBe('fresh');
  });
});
