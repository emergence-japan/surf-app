import { NextRequest, NextResponse } from 'next/server';

// レート制限設定
const WINDOW_MS = 60_000;  // 1分間のウィンドウ
const MAX_REQUESTS = 60;   // 1分あたり最大60リクエスト/IP

/**
 * モジュールレベルのストア（同一Edgeワーカーインスタンス内で持続）。
 * 複数インスタンスへのデプロイ（水平スケール）では Redis/Upstash KV に切り替えてください。
 */
const store = new Map<string, { count: number; resetAt: number }>();

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

export function middleware(request: NextRequest) {
  const ip = getClientIp(request);
  const now = Date.now();

  const prev = store.get(ip);
  if (!prev || now > prev.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return addRateLimitHeaders(NextResponse.next(), 1, MAX_REQUESTS, now + WINDOW_MS);
  }

  const record = { count: prev.count + 1, resetAt: prev.resetAt };
  store.set(ip, record);

  if (record.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return new NextResponse(
      JSON.stringify({ error: 'リクエストが多すぎます。しばらくお待ちください。' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetAt / 1000)),
        },
      }
    );
  }

  return addRateLimitHeaders(NextResponse.next(), record.count, MAX_REQUESTS, record.resetAt);
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

// /api/* のみにレート制限を適用
export const config = {
  matcher: '/api/:path*',
};
