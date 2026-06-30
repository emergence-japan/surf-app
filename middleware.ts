import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { checkRateLimit } from '@/lib/rate-limit';

function getClientIp(req: NextRequest): string {
  // Vercel Edge Runtime は NextRequest に ip プロパティを注入するが、
  // 型定義には含まれないため型アサーションで取得する
  const vercelIp = (req as NextRequest & { ip?: string }).ip;
  return (
    vercelIp ??
    req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ??
    'unknown'
  );
}

export async function middleware(request: NextRequest) {
  // /api/* はレート制限のみ（セッション更新は不要）。
  // それ以外のページは Supabase セッションを更新する。
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return rateLimit(request);
  }
  return updateSession(request);
}

// IP ベースのレート制限（/api/* 専用）。
// カウントは Upstash Redis（未設定時はインスタンス内メモリ）。lib/rate-limit.ts 参照。
async function rateLimit(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);
  const result = await checkRateLimit(ip);

  if (result.limited) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new NextResponse(
      JSON.stringify({ error: 'リクエストが多すぎます。しばらくお待ちください。' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(1, retryAfter)),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return addRateLimitHeaders(NextResponse.next(), result.count, result.limit, result.resetAt);
}

function addRateLimitHeaders(
  res: NextResponse,
  count: number,
  limit: number,
  resetAt: number
): NextResponse {
  res.headers.set('X-RateLimit-Limit', String(limit));
  res.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - count)));
  res.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  return res;
}

// ページ全般（セッション更新）と /api/*（レート制限）の両方で実行する。
// 静的アセット・画像・favicon は除外して無駄な実行を避ける。
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
