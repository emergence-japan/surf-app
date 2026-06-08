import 'server-only';

// 有料(プレミアム)判定の入口。
// フェーズD(Stripe課金)が未実装のため、現在は全ユーザーを無料として扱う。
//
// フェーズDでやること:
//   - profiles テーブル(または subscriptions)に is_premium / current_period_end を持たせ、
//     Stripe Webhook で更新する。
//   - ここで supabase から該当列を読み、有効期限内なら true を返すだけにする。
//   - これにより limits.ts の判定（canAddFavorite / shouldLockSpot）が自動的に有料対応になる。

/** 現在ログイン中ユーザーが有料(プレミアム)会員か。未ログインは false。 */
export async function isPremiumUser(): Promise<boolean> {
  // フェーズC時点では課金基盤が無いため、常に無料扱い。
  return false;
}
