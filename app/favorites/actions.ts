'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isKnownSpotId } from '@/lib/favorites/spot-ids';
import { isFavorite, addFavorite, removeFavorite, countFavorites } from '@/lib/favorites/favorites';
import { isPremiumUser } from '@/lib/plan/premium';
import { canAddFavorite } from '@/lib/plan/limits';

// toggleFavorite の戻り値（判別可能ユニオン）。
//  - ok:true  … 追加/解除に成功。favorited はトグル後の状態。
//  - ok:false … 無料プランの上限に達して追加できなかった（解除は常に成功するので発生しない）。
export type ToggleResult =
  | { ok: true; favorited: boolean }
  | { ok: false; reason: 'limit_reached' };

// お気に入りのトグル。ログイン必須。未ログインならログイン画面へ。
// 無料プランで上限を超える「追加」はサーバー側で拒否する（クライアントを信用しない）。
export async function toggleFavorite(spotId: string): Promise<ToggleResult> {
  if (!isKnownSpotId(spotId)) throw new Error('Unknown spot id');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // UI 側でも誘導するが、サーバー側でも必ずガードする。
    redirect(`/login?next=/point/${spotId}`);
  }

  const wasFavorited = await isFavorite(spotId);

  // 解除は常に許可。
  if (wasFavorited) {
    await removeFavorite(spotId);
    revalidatePath('/favorites');
    return { ok: true, favorited: false };
  }

  // 追加は上限ガードを通す。
  const [isPremium, currentCount] = await Promise.all([
    isPremiumUser(),
    countFavorites(),
  ]);
  if (!canAddFavorite({ isPremium, currentCount })) {
    return { ok: false, reason: 'limit_reached' };
  }

  await addFavorite(spotId);
  revalidatePath('/favorites');
  return { ok: true, favorited: true };
}
