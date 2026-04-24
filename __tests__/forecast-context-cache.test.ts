import { describe, it, expect, beforeEach, vi } from 'vitest';

// sessionStorage のキャッシュロジックをモジュール内部と同等に再実装してテスト
const CACHE_KEY = 'surf-forecast-v1';
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  data: unknown[];
  timestamp: number;
}

function readCache(storage: Storage): unknown[] | null {
  try {
    const raw = storage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      storage.removeItem(CACHE_KEY);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(storage: Storage, data: unknown[]): void {
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    storage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // 書き込み失敗は無視
  }
}

// テスト用インメモリ sessionStorage
function makeStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

describe('forecast cache', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = makeStorage();
    vi.useRealTimers();
  });

  it('書き込んだデータをそのまま読み返せる', () => {
    const data = [{ id: 'point-1', beach: 'テストビーチ' }];
    writeCache(storage, data);
    expect(readCache(storage)).toEqual(data);
  });

  it('キャッシュが空の場合は null を返す', () => {
    expect(readCache(storage)).toBeNull();
  });

  it('TTL を超えた場合は null を返しキャッシュを削除する', () => {
    vi.useFakeTimers();
    const data = [{ id: 'point-1' }];
    writeCache(storage, data);

    // TTL + 1ms 経過させる
    vi.advanceTimersByTime(CACHE_TTL_MS + 1);
    expect(readCache(storage)).toBeNull();
    expect(storage.getItem(CACHE_KEY)).toBeNull();
  });

  it('TTL 内であればデータを返す', () => {
    vi.useFakeTimers();
    const data = [{ id: 'point-2' }];
    writeCache(storage, data);

    vi.advanceTimersByTime(CACHE_TTL_MS - 1000);
    expect(readCache(storage)).toEqual(data);
  });

  it('不正なJSONが格納されている場合は null を返す', () => {
    storage.setItem(CACHE_KEY, '{invalid json}');
    expect(readCache(storage)).toBeNull();
  });

  it('空配列もキャッシュできる', () => {
    writeCache(storage, []);
    expect(readCache(storage)).toEqual([]);
  });
});
