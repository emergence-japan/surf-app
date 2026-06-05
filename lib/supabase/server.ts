import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from './env';

// サーバー（Server Component / Route Handler / Server Action）で使う Supabase クライアント。
// Next.js の cookies() を介してセッション Cookie を読み書きする。
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component から呼ばれた場合は Cookie を書けない（読み取り専用）。
          // セッションの更新は middleware 側で行われるため、ここでは無視してよい。
        }
      },
    },
  });
}
