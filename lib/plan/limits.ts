// プラン上限の純粋な判定ロジック。
// DB やセッションに依存しない純関数だけを置く（テストしやすさのため）。
// 「誰が有料か」「現在の件数」は呼び出し側が解決して渡す。

/** 無料プランで登録できるお気に入りの上限数。 */
export const FREE_FAVORITE_LIMIT = 3;

interface PlanCount {
  isPremium: boolean;
  currentCount: number;
}

/** これ以上お気に入りを追加できるか。有料は無制限、無料は上限未満なら可。 */
export function canAddFavorite({ isPremium, currentCount }: PlanCount): boolean {
  if (isPremium) return true;
  return currentCount < FREE_FAVORITE_LIMIT;
}

/** お気に入りの残り枠。有料は無制限を表す null、無料は 0 以上の整数。 */
export function remainingFavorites({ isPremium, currentCount }: PlanCount): number | null {
  if (isPremium) return null;
  return Math.max(0, FREE_FAVORITE_LIMIT - currentCount);
}

interface LockInput {
  isPremium: boolean;
  isFavorited: boolean;
}

/**
 * スポット詳細をロック（ボカし表示）すべきか。
 * 課金モデル: 「お気に入りに入れたスポットだけ詳細が見れる」。
 * → 有料、またはお気に入り済みなら見れる。無料の未お気に入りはロック。
 */
export function shouldLockSpot({ isPremium, isFavorited }: LockInput): boolean {
  if (isPremium) return false;
  return !isFavorited;
}
