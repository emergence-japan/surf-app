import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { isKnownSpotId } from './spot-ids';

// お気に入りのサーバーサイド・データアクセス層（Repository）。
// RLS で DB 側でも保護されるが、ここでも user.id でクエリを絞り防御的に扱う。

const TABLE = 'favorites';

// ログイン中ユーザーのお気に入り spot_id を新しい順で返す。未ログインなら空配列。
export async function listFavoriteSpotIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('spot_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row) => row.spot_id as string);
}

// ログイン中ユーザーのお気に入り件数。未ログインなら 0。
// 上限ガード（プラン判定）のために使う。
export async function countFavorites(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from(TABLE)
    .select('spot_id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error || count === null) return 0;
  return count;
}

// 指定スポットがお気に入り済みか。未ログインなら false。
export async function isFavorite(spotId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from(TABLE)
    .select('spot_id')
    .eq('user_id', user.id)
    .eq('spot_id', spotId)
    .maybeSingle();

  return data !== null;
}

// お気に入りに追加（冪等）。未ログイン・不正IDは例外。
export async function addFavorite(spotId: string): Promise<void> {
  if (!isKnownSpotId(spotId)) throw new Error(`Unknown spot id: ${spotId}`);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 既に存在する場合は無視（冪等）。
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: user.id, spot_id: spotId }, { onConflict: 'user_id,spot_id', ignoreDuplicates: true });

  if (error) throw new Error('Failed to add favorite');
}

// お気に入りを解除。未ログインは例外。
export async function removeFavorite(spotId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', user.id)
    .eq('spot_id', spotId);

  if (error) throw new Error('Failed to remove favorite');
}
