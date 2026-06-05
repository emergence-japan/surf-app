'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isKnownSpotId } from '@/lib/favorites/spot-ids';
import { isFavorite, addFavorite, removeFavorite } from '@/lib/favorites/favorites';

// お気に入りのトグル。ログイン必須。未ログインならログイン画面へ。
// 戻り値の favorited はトグル後の状態（クライアントの楽観的UIを確定させるため）。
export async function toggleFavorite(spotId: string): Promise<{ favorited: boolean }> {
  if (!isKnownSpotId(spotId)) throw new Error('Unknown spot id');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // UI 側でも誘導するが、サーバー側でも必ずガードする（クライアントを信用しない）。
    redirect(`/login?next=/point/${spotId}`);
  }

  const wasFavorited = await isFavorite(spotId);
  if (wasFavorited) {
    await removeFavorite(spotId);
  } else {
    await addFavorite(spotId);
  }

  revalidatePath('/favorites');
  return { favorited: !wasFavorited };
}
