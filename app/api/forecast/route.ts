import { NextResponse } from 'next/server';
import { z } from 'zod';
import { surfPoints, type SurfPoint } from '@/lib/surf-points';
import { fetchPointForecast } from '@/lib/forecast-fetcher';
import {
  readSpotCache,
  writeSpotCache,
  classifyFreshness,
  isCacheConfigured,
} from '@/lib/forecast-cache';
import type { ForecastApiResponse, SpotForecastEnvelope } from '@/lib/types';

export const runtime = 'nodejs';
// SWR: 個別キャッシュを参照するためルートレベルのキャッシュは無効化
export const dynamic = 'force-dynamic';

const ForecastQuerySchema = z.object({
  spotId: z
    .string()
    .regex(/^point-\d+$/, 'spotId は "point-数字" の形式で指定してください')
    .optional(),
});

// SWR: キャッシュが stale または欠損のとき、その場でフェッチを試みる。
// Cron が走っていれば通常は fresh のまま返るので、これは fallback パス。
async function resolveSpot(point: SurfPoint): Promise<SpotForecastEnvelope> {
  const cached = await readSpotCache(point.id);

  if (cached) {
    const freshness = classifyFreshness(cached.fetchedAt);
    if (freshness === 'fresh') {
      return {
        id: point.id,
        name: point.name,
        status: 'fresh',
        fetchedAt: cached.fetchedAt,
        data: cached.data,
      };
    }
    // stale: その場で更新を試みる。失敗してもキャッシュ済みデータを返す。
    try {
      const fresh = await fetchPointForecast(point);
      await writeSpotCache(point.id, fresh);
      return {
        id: point.id,
        name: point.name,
        status: 'fresh',
        fetchedAt: Date.now(),
        data: fresh,
      };
    } catch {
      return {
        id: point.id,
        name: point.name,
        status: 'stale',
        fetchedAt: cached.fetchedAt,
        data: cached.data,
      };
    }
  }

  // キャッシュなし: 直接フェッチ。失敗時は error を返すがスポット自体は表示する。
  try {
    const data = await fetchPointForecast(point);
    await writeSpotCache(point.id, data);
    return {
      id: point.id,
      name: point.name,
      status: 'fresh',
      fetchedAt: Date.now(),
      data,
    };
  } catch (e) {
    return {
      id: point.id,
      name: point.name,
      status: 'error',
      fetchedAt: null,
      data: null,
      error: e instanceof Error ? e.message : 'unknown',
    };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = ForecastQuerySchema.safeParse({
    spotId: searchParams.get('spotId') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'パラメータが不正です', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { spotId } = parsed.data;
  const targetPoints = spotId ? surfPoints.filter(p => p.id === spotId) : surfPoints;

  if (spotId && targetPoints.length === 0) {
    return NextResponse.json({ error: '指定されたスポットが見つかりません' }, { status: 404 });
  }

  if (!isCacheConfigured()) {
    console.warn('[api/forecast] Redis cache is not configured. Falling back to direct fetch (every request hits open-meteo).');
  }

  const spots = await Promise.all(targetPoints.map(resolveSpot));

  const meta = {
    total: spots.length,
    fresh: spots.filter(s => s.status === 'fresh').length,
    stale: spots.filter(s => s.status === 'stale').length,
    error: spots.filter(s => s.status === 'error').length,
    servedAt: Date.now(),
  };

  const response: ForecastApiResponse = { spots, meta };
  return NextResponse.json(response);
}
