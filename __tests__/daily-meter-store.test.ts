import { describe, it, expect, beforeEach, vi } from 'vitest';

// daily-meter-store は 'use client' だが、依存は window.localStorage と
// 純粋ロジックのみ。node 環境で localStorage をモックすれば永続層を検証できる。

// surf-points に依存する isKnownSpotId を実データで使うため、実在IDを1つ拝借する。
import { surfPoints } from '@/lib/surf-points';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(k: string) { return this.store.has(k) ? this.store.get(k)! : null; }
  setItem(k: string, v: string) { this.store.set(k, v); }
  removeItem(k: string) { this.store.delete(k); }
  clear() { this.store.clear(); }
}

const KEY = 'swell.dailyMeter.v1';
const REAL_ID = surfPoints[0].id;
const REAL_ID_2 = surfPoints[1].id;

let store: typeof import('@/lib/plan/daily-meter-store');

beforeEach(async () => {
  vi.resetModules();
  // window.localStorage をモック
  const mem = new MemoryStorage();
  vi.stubGlobal('window', { localStorage: mem });
  vi.stubGlobal('localStorage', mem);
  store = await import('@/lib/plan/daily-meter-store');
});

describe('loadMeter', () => {
  it('保存が無ければ今日の空メーターを返す', () => {
    const m = store.loadMeter();
    expect(m.spotIds).toEqual([]);
    expect(m.day).toBe(store.today());
  });

  it('壊れたJSONは空メーターにフォールバックする', () => {
    window.localStorage.setItem(KEY, '{not json');
    const m = store.loadMeter();
    expect(m.spotIds).toEqual([]);
  });

  it('未知のスポットIDは読み込み時に除外する', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ day: store.today(), spotIds: [REAL_ID, 'point-9999', 123] })
    );
    const m = store.loadMeter();
    expect(m.spotIds).toEqual([REAL_ID]);
  });
});

describe('recordSpotView', () => {
  it('実在スポットを記録し、localStorage に永続化する', () => {
    const m = store.recordSpotView(REAL_ID);
    expect(m.spotIds).toContain(REAL_ID);

    const raw = JSON.parse(window.localStorage.getItem(KEY)!);
    expect(raw.spotIds).toContain(REAL_ID);
  });

  it('複数スポットを順に記録できる', () => {
    store.recordSpotView(REAL_ID);
    const m = store.recordSpotView(REAL_ID_2);
    expect(m.spotIds).toEqual([REAL_ID, REAL_ID_2]);
  });

  it('同じスポットの再記録は重複しない（冪等）', () => {
    store.recordSpotView(REAL_ID);
    const m = store.recordSpotView(REAL_ID);
    expect(m.spotIds).toEqual([REAL_ID]);
  });

  it('未知のスポットIDは記録しない', () => {
    const m = store.recordSpotView('point-9999');
    expect(m.spotIds).toEqual([]);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('前日の記録は当日記録時にリセットされる', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ day: '2000-01-01', spotIds: [REAL_ID, REAL_ID_2] })
    );
    const m = store.recordSpotView(REAL_ID);
    expect(m.day).toBe(store.today());
    expect(m.spotIds).toEqual([REAL_ID]); // 前日分は消えて今日の1件だけ
  });
});
