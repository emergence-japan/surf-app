// 無料ユーザーの「1日に閲覧できるスポット数」メータリングの純粋ロジック。
// DB やブラウザ API に依存しない純関数だけを置く（テストしやすさのため）。
// 永続化（localStorage 読み書き）は daily-meter-store.ts が担う。
//
// 課金モデル:
//   無料 … 1日3スポットまで詳細を閲覧できる（日付が変わるとリセット）。
//          一度見たスポットは同日中なら枠を消費せず再閲覧できる。
//   有料 … 無制限。
// ★お気に入りはこの制限とは無関係（有料の特典）。

/** 無料プランで1日に閲覧できるスポットの上限数。 */
export const FREE_DAILY_VIEW_LIMIT = 3;

/** ある1日に閲覧したスポットの記録。day はローカル日付 'YYYY-MM-DD'。 */
export interface DailyMeter {
  day: string;
  spotIds: string[];
}

/** Date をローカルタイムゾーンの 'YYYY-MM-DD' に変換する。 */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 指定日の空メーター。 */
export function emptyMeter(today: string): DailyMeter {
  return { day: today, spotIds: [] };
}

/** メーターが today のものなら spotIds を、別日なら空配列を返す（リセット相当）。 */
function todaysSpotIds(meter: DailyMeter, today: string): string[] {
  return meter.day === today ? meter.spotIds : [];
}

/** そのスポットを「今日」既に閲覧済みか。 */
export function isViewedToday(meter: DailyMeter, spotId: string, today: string): boolean {
  return todaysSpotIds(meter, today).includes(spotId);
}

/** 今日の残り閲覧枠。有料は無制限を表す null、無料は 0 以上の整数。 */
export function remainingViews(
  meter: DailyMeter,
  today: string,
  isPremium: boolean
): number | null {
  if (isPremium) return null;
  const used = todaysSpotIds(meter, today).length;
  return Math.max(0, FREE_DAILY_VIEW_LIMIT - used);
}

/**
 * そのスポットを今すぐ閲覧できるか。
 * 有料・閲覧済みは常に可。未閲覧は当日の残り枠があれば可。
 */
export function canViewNewSpot(
  meter: DailyMeter,
  spotId: string,
  today: string,
  isPremium: boolean
): boolean {
  if (isPremium) return true;
  if (isViewedToday(meter, spotId, today)) return true;
  return todaysSpotIds(meter, today).length < FREE_DAILY_VIEW_LIMIT;
}

/**
 * スポットの閲覧を記録した新しいメーターを返す（非破壊）。
 * 日付が変わっていれば当日分にリセットしてから記録する。既存IDは重複追加しない。
 */
export function recordView(meter: DailyMeter, spotId: string, today: string): DailyMeter {
  const current = todaysSpotIds(meter, today);
  if (current.includes(spotId)) {
    return { day: today, spotIds: current };
  }
  return { day: today, spotIds: [...current, spotId] };
}
