'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  type DailyMeter,
  isViewedToday,
  remainingViews,
} from '@/lib/plan/daily-meter';
import { loadMeter, recordSpotView, today } from '@/lib/plan/daily-meter-store';

// スポット詳細ページの「無料1日3スポット」閲覧メーターを扱うフック。
// localStorage の当日の閲覧記録をもとに、このスポットの詳細を見せてよいか／
// 残り枠／壁を出すべきかを返す。
//
// 状態は3つに分かれる:
//   - viewable=true              … 詳細を表示してよい（有料 or 当日すでに解放済み）
//   - viewable=false, limitReached=false … 枠が残っている。解放ボタンを出す
//   - viewable=false, limitReached=true  … 当日の枠切れ。壁（課金導線）を出す
//
// 注: isPremium は課金基盤(フェーズD)が未実装のため現状 false 固定。
// サーバー側 isPremiumUser() と同じ前提。課金実装時にここへ有料判定を渡す。
const IS_PREMIUM = false;

export interface DailyViewMeter {
  /** localStorage 解決済みか（解決前はUIを出さずちらつきを防ぐ） */
  resolved: boolean;
  /** このスポットの詳細を表示してよいか（有料 or 当日解放済み） */
  viewable: boolean;
  /** 今日の残り閲覧枠。有料は無制限を表す null */
  remaining: number | null;
  /** 当日の枠切れで、このスポット（未解放）を新たに開けない状態か */
  limitReached: boolean;
  /** このスポットの枠を消費して閲覧を開始する（冪等） */
  unlock: () => void;
}

export function useDailyViewMeter(spotId: string): DailyViewMeter {
  const [meter, setMeter] = useState<DailyMeter | null>(null);

  // 初回マウントで localStorage を解決
  useEffect(() => {
    setMeter(loadMeter());
  }, []);

  const day = today();
  const resolved = meter !== null;

  const alreadyViewed = resolved && isViewedToday(meter, spotId, day);
  const remaining = resolved ? remainingViews(meter, day, IS_PREMIUM) : null;

  // 有料、または当日すでに解放したスポットは表示してよい
  const viewable = resolved && (IS_PREMIUM || alreadyViewed);
  // 未解放 かつ 残り枠ゼロ → 壁
  const limitReached = resolved && !IS_PREMIUM && !alreadyViewed && remaining === 0;

  const unlock = useCallback(() => {
    setMeter(recordSpotView(spotId));
  }, [spotId]);

  return { resolved, viewable, remaining, limitReached, unlock };
}
