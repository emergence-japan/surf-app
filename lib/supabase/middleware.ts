import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from './env';

// middleware からセッションを更新するヘルパー。
// getUser() を呼ぶことでトークンがリフレッシュされ、更新後の Cookie が
// レスポンスに書き込まれる。これを呼ばないとページ遷移でセッションが切れる。
//
// 注意: Phase A ではルートガード（未ログインのリダイレクト）は行わない。
//       保護対象ルートがまだ無いため、セッション更新だけに専念する。
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // request と response の両方に書き込む（@supabase/ssr の規定パターン）。
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() がトークンリフレッシュをトリガーする。必ず呼ぶこと。
  await supabase.auth.getUser();

  return response;
}
