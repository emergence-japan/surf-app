import { describe, it, expect } from 'vitest';
import {
  FREE_DAILY_VIEW_LIMIT,
  dayKey,
  emptyMeter,
  isViewedToday,
  canViewNewSpot,
  remainingViews,
  recordView,
  type DailyMeter,
} from '@/lib/plan/daily-meter';

const DAY = '2026-06-30';

describe('FREE_DAILY_VIEW_LIMIT', () => {
  it('無料プランの1日の閲覧上限は3', () => {
    expect(FREE_DAILY_VIEW_LIMIT).toBe(3);
  });
});

describe('dayKey', () => {
  it('Date をローカル日付の YYYY-MM-DD に変換する', () => {
    // 2026-06-30 12:00 ローカル
    const d = new Date(2026, 5, 30, 12, 0, 0);
    expect(dayKey(d)).toBe('2026-06-30');
  });

  it('1桁の月日をゼロ埋めする', () => {
    const d = new Date(2026, 0, 5, 0, 0, 0);
    expect(dayKey(d)).toBe('2026-01-05');
  });
});

describe('emptyMeter', () => {
  it('指定日の空メーターを返す', () => {
    expect(emptyMeter(DAY)).toEqual({ day: DAY, spotIds: [] });
  });
});

describe('isViewedToday', () => {
  it('同じ日に記録済みのスポットは true', () => {
    const meter: DailyMeter = { day: DAY, spotIds: ['point-1', 'point-2'] };
    expect(isViewedToday(meter, 'point-1', DAY)).toBe(true);
  });

  it('未記録のスポットは false', () => {
    const meter: DailyMeter = { day: DAY, spotIds: ['point-1'] };
    expect(isViewedToday(meter, 'point-9', DAY)).toBe(false);
  });

  it('日付が変わっていれば（前日の記録）false', () => {
    const meter: DailyMeter = { day: '2026-06-29', spotIds: ['point-1'] };
    expect(isViewedToday(meter, 'point-1', DAY)).toBe(false);
  });
});

describe('remainingViews', () => {
  it('有料は無制限（null）', () => {
    const meter: DailyMeter = { day: DAY, spotIds: ['point-1', 'point-2', 'point-3'] };
    expect(remainingViews(meter, DAY, true)).toBeNull();
  });

  it('当日の記録数に応じて残り枠を返す', () => {
    expect(remainingViews({ day: DAY, spotIds: [] }, DAY, false)).toBe(3);
    expect(remainingViews({ day: DAY, spotIds: ['point-1'] }, DAY, false)).toBe(2);
    expect(remainingViews({ day: DAY, spotIds: ['point-1', 'point-2', 'point-3'] }, DAY, false)).toBe(0);
  });

  it('日付が変わっていれば残り枠は満タンに戻る', () => {
    const meter: DailyMeter = { day: '2026-06-29', spotIds: ['point-1', 'point-2', 'point-3'] };
    expect(remainingViews(meter, DAY, false)).toBe(3);
  });
});

describe('canViewNewSpot', () => {
  it('有料は常に閲覧できる', () => {
    const meter: DailyMeter = { day: DAY, spotIds: ['point-1', 'point-2', 'point-3'] };
    expect(canViewNewSpot(meter, 'point-9', DAY, true)).toBe(true);
  });

  it('既に当日見たスポットは枠を消費せず常に閲覧できる', () => {
    const meter: DailyMeter = { day: DAY, spotIds: ['point-1', 'point-2', 'point-3'] };
    expect(canViewNewSpot(meter, 'point-1', DAY, false)).toBe(true);
  });

  it('未閲覧でも残り枠があれば閲覧できる', () => {
    const meter: DailyMeter = { day: DAY, spotIds: ['point-1'] };
    expect(canViewNewSpot(meter, 'point-9', DAY, false)).toBe(true);
  });

  it('未閲覧で当日の枠を使い切っていれば閲覧できない', () => {
    const meter: DailyMeter = { day: DAY, spotIds: ['point-1', 'point-2', 'point-3'] };
    expect(canViewNewSpot(meter, 'point-9', DAY, false)).toBe(false);
  });

  it('日付が変わっていれば枠はリセットされ閲覧できる', () => {
    const meter: DailyMeter = { day: '2026-06-29', spotIds: ['point-1', 'point-2', 'point-3'] };
    expect(canViewNewSpot(meter, 'point-9', DAY, false)).toBe(true);
  });
});

describe('recordView', () => {
  it('当日の新規スポットを記録した新しいメーターを返す（非破壊）', () => {
    const meter: DailyMeter = { day: DAY, spotIds: ['point-1'] };
    const next = recordView(meter, 'point-2', DAY);
    expect(next).toEqual({ day: DAY, spotIds: ['point-1', 'point-2'] });
    // 元は破壊しない
    expect(meter).toEqual({ day: DAY, spotIds: ['point-1'] });
  });

  it('既に記録済みのスポットは重複追加しない（冪等）', () => {
    const meter: DailyMeter = { day: DAY, spotIds: ['point-1', 'point-2'] };
    const next = recordView(meter, 'point-1', DAY);
    expect(next.spotIds).toEqual(['point-1', 'point-2']);
  });

  it('日付が変わっていれば当日分だけにリセットして記録する', () => {
    const meter: DailyMeter = { day: '2026-06-29', spotIds: ['point-1', 'point-2', 'point-3'] };
    const next = recordView(meter, 'point-9', DAY);
    expect(next).toEqual({ day: DAY, spotIds: ['point-9'] });
  });
});
