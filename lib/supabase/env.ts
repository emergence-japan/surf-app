// Supabase 接続情報を環境変数から取得する。
// 未設定なら起動時に分かりやすく失敗させる（fail-fast）。
export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env.local (see .env.example).');
  }
  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Add it to .env.local (see .env.example).');
  }

  return { url, anonKey };
}
