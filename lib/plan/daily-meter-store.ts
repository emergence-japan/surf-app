'use client';

// 無料ユーザーの「1日の閲覧メーター」を localStorage に永続化する層。
// 判定ロジックは daily-meter.ts（純粋関数）に委譲し、ここは読み書きと
// 壊れたデータの握りつぶしだけを担う。SSR では window が無いので no-op。

import { isKnownSpotId } from '@/lib/favorites/spot-ids';
import {
  type DailyMeter,
  dayKey,
  emptyMeter,
  recordView,
} from '@/lib/plan/daily-meter';

const STORAGE_KEY = 'swell.dailyMeter.v1';

/** 今日のローカル日付キー。 */
export function today(): string {
  return dayKey(new Date());
}

function hasStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

/**
 * 保存済みメーターを読む。壊れていれば今日の空メーターを返す。
 * 既知でないスポットIDは捨てる（防御的）。
 */
export function loadMeter(): DailyMeter {
  const fallback = emptyMeter(today());
  if (!hasStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as DailyMeter).day !== 'string' ||
      !Array.isArray((parsed as DailyMeter).spotIds)
    ) {
      return fallback;
    }

    const day = (parsed as DailyMeter).day;
    const spotIds = (parsed as DailyMeter).spotIds.filter(
      (id): id is string => typeof id === 'string' && isKnownSpotId(id)
    );
    return { day, spotIds };
  } catch {
    return fallback;
  }
}

function saveMeter(meter: DailyMeter): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meter));
  } catch {
    // クォータ超過やプライベートモードでは保存できないが、致命的ではないので無視。
  }
}

/**
 * スポットの閲覧を記録して保存し、更新後のメーターを返す。
 * 既知でないIDは記録しない。日付が変わっていれば内部でリセットされる。
 */
export function recordSpotView(spotId: string): DailyMeter {
  const current = loadMeter();
  if (!isKnownSpotId(spotId)) return current;
  const next = recordView(current, spotId, today());
  saveMeter(next);
  return next;
}
