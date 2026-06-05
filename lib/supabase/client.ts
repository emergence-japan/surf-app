import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseEnv } from './env';

// クライアントコンポーネント（ブラウザ）で使う Supabase クライアント。
// Google ログインなどクライアント側で呼ぶ処理に使用する。
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
