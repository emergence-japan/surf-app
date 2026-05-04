import { NextResponse } from 'next/server';
import { surfPoints } from '@/lib/surf-points';
import { fetchPointForecast } from '@/lib/forecast-fetcher';
import { writeSpotCache, isCacheConfigured } from '@/lib/forecast-cache';

// Vercel Cron は GET リクエストでのみ起動するため明示
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 14スポット並列でも余裕

interface RefreshSummary {
  total: number;
  succeeded: number;
  failed: number;
  failures: Array<{ id: string; error: string }>;
  durationMs: number;
}

async function refreshOne(point: typeof surfPoints[number]): Promise<{ id: string; ok: boolean; error?: string }> {
  try {
    const data = await fetchPointForecast(point);
    await writeSpotCache(point.id, data);
    return { id: point.id, ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { id: point.id, ok: false, error: message };
  }
}

export async function GET(request: Request) {
  // Vercel Cron は Authorization: Bearer <CRON_SECRET> を付けてくる
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  if (!isCacheConfigured()) {
    return NextResponse.json(
      { error: 'cache not configured: set UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN' },
      { status: 500 }
    );
  }

  const startedAt = Date.now();
  const results = await Promise.all(surfPoints.map(refreshOne));

  const summary: RefreshSummary = {
    total: results.length,
    succeeded: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    failures: results
      .filter(r => !r.ok)
      .map(r => ({ id: r.id, error: r.error ?? 'unknown' })),
    durationMs: Date.now() - startedAt,
  };

  if (summary.failed > 0) {
    console.warn('[cron/refresh-forecast]', summary);
  } else {
    console.log('[cron/refresh-forecast] all ok', { total: summary.total, durationMs: summary.durationMs });
  }

  return NextResponse.json(summary);
}
