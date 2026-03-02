import { NextResponse } from 'next/server';
import { z } from 'zod';
import { surfPoints } from '@/lib/surf-points';
import { computeTideHeight } from '@/lib/tide-predictor';
import { convertWindDirection } from '@/lib/converters';
import {
  degreesToDir,
  calculateEffectiveHeight,
  getWaveBaseScore,
  getWindEffect,
  calculateQuality,
  checkBestSwell,
  generateConditionSummary,
} from '@/lib/wave-calculations';

// 1時間キャッシュ
export const revalidate = 3600;

// クエリパラメータのスキーマ
const ForecastQuerySchema = z.object({
  spotId: z
    .string()
    .regex(/^point-\d+$/, 'spotId は "point-数字" の形式で指定してください')
    .optional(),
});

// fetchタイムアウト付きラッパー
async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// 1ポイント分の処理
async function processPoint(point: typeof surfPoints[0]) {
  try {
    const windUrl = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}`
      + `&current=wind_speed_10m,wind_direction_10m,visibility,cloud_cover`
      + `&hourly=wind_speed_10m,wind_direction_10m`
      + `&daily=wind_speed_10m_max,wind_direction_10m_dominant,weather_code`
      + `&models=best_match`
      + `&timezone=Asia%2FTokyo`;

    const waveUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${point.lat}&longitude=${point.lon}`
      + `&current=wave_height,wave_direction,wave_period`
      + `&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature`
      + `&daily=wave_height_max,wave_direction_dominant`
      + `&models=best_match,gwam`
      + `&timezone=Asia%2FTokyo`;

    const [windRes, waveRes] = await Promise.all([
      fetchWithTimeout(windUrl).then(res => res.json()),
      fetchWithTimeout(waveUrl).then(res => res.json())
    ]);

    // APIエラーチェック
    if (windRes.error || waveRes.error) {
      console.error(`API error for ${point.name}`, windRes.reason ?? '', waveRes.reason ?? '');
      return null;
    }

    // 必須フィールドの存在確認
    if (!waveRes.hourly?.time || !Array.isArray(waveRes.hourly.time) || waveRes.hourly.time.length === 0) {
      console.error(`Missing hourly wave data for ${point.name}`);
      return null;
    }

    // 現在時刻に最も近いインデックスを検索
    const now = new Date();
    let currentIndex = 0;
    let minDiff = Infinity;

    waveRes.hourly.time.forEach((timeStr: string, i: number) => {
      const diff = Math.abs(now.getTime() - new Date(timeStr).getTime());
      if (diff < minDiff) {
        minDiff = diff;
        currentIndex = i;
      }
    });

    let curWave = waveRes.current?.wave_height ?? null;
    if (curWave === null && waveRes.hourly.wave_height_gwam) curWave = waveRes.hourly.wave_height_gwam[currentIndex] ?? null;

    let curWaveDir = waveRes.current?.wave_direction ?? null;
    if (curWaveDir === null && waveRes.hourly.wave_direction_gwam) curWaveDir = waveRes.hourly.wave_direction_gwam[currentIndex] ?? null;

    const curWindSpd = windRes.current?.wind_speed_10m ?? null;
    const curWindDir = windRes.current?.wind_direction_10m ?? null;

    let curTemp = 0;
    if (waveRes.hourly.sea_surface_temperature_marine_best_match) {
      curTemp = waveRes.hourly.sea_surface_temperature_marine_best_match[currentIndex] ?? 0;
    } else if (waveRes.hourly.sea_surface_temperature_gwam) {
      curTemp = waveRes.hourly.sea_surface_temperature_gwam[currentIndex] ?? 0;
    } else if (waveRes.hourly.sea_surface_temperature) {
      curTemp = waveRes.hourly.sea_surface_temperature[currentIndex] ?? 0;
    }

    const curVisibility = windRes.current?.visibility ?? null;
    const curCloudCover = windRes.current?.cloud_cover ?? null;

    const windSpeedMs = curWindSpd !== null ? curWindSpd / 3.6 : 0;
    const windDirStr = degreesToDir(curWindDir);
    const waveDirStr = degreesToDir(curWaveDir);

    const effectiveHeight = calculateEffectiveHeight(curWave, waveDirStr, point.beachFacing, waveRes.current?.wave_period);
    const waveBase = getWaveBaseScore(effectiveHeight);
    const curPeriod = waveRes.current?.wave_period ?? 0;
    const isBestSwell = checkBestSwell(point.bestSwell, waveDirStr, curPeriod);
    const windEffect = getWindEffect(point.beachFacing, windDirStr, windSpeedMs);
    const finalQuality = calculateQuality(waveBase.score, windEffect, isBestSwell, effectiveHeight, curPeriod);

    // hourlyデータのフォールバックチェーン（null安全）
    const hWaveHeight: (number | null)[] | null =
      waveRes.hourly.wave_height_best_match ??
      waveRes.hourly.wave_height_gwam ??
      waveRes.hourly.wave_height ??
      null;

    const hWavePeriod: (number | null)[] | null =
      waveRes.hourly.wave_period_best_match ??
      waveRes.hourly.wave_period_gwam ??
      waveRes.hourly.wave_period ??
      null;

    const hWaveDir: (number | null)[] | null =
      waveRes.hourly.wave_direction_best_match ??
      waveRes.hourly.wave_direction_gwam ??
      waveRes.hourly.wave_direction ??
      null;

    const hWindSpeed: (number | null)[] | null =
      windRes.hourly?.wind_speed_10m_jma_msm ??
      windRes.hourly?.wind_speed_10m_gfs_seamless ??
      windRes.hourly?.wind_speed_10m ??
      null;

    const hWindDir: (number | null)[] | null =
      windRes.hourly?.wind_direction_10m_jma_msm ??
      windRes.hourly?.wind_direction_10m_gfs_seamless ??
      windRes.hourly?.wind_direction_10m ??
      null;

    const hourlyData = hWaveHeight
      ? waveRes.hourly.time.map((time: string, i: number) => {
          const hSwellHeight = hWaveHeight[i] ?? null;
          const hWDirStr = degreesToDir(hWaveDir?.[i]);
          const hEffectiveHeight = calculateEffectiveHeight(hSwellHeight, hWDirStr, point.beachFacing, hWavePeriod?.[i]);
          const hWBase = getWaveBaseScore(hEffectiveHeight);
          const hWindDirStr = degreesToDir(hWindDir?.[i]);
          const hWindSpdMs = (hWindSpeed?.[i] ?? null) !== null ? (hWindSpeed![i]! / 3.6) : 0;
          const hPeriod = hWavePeriod?.[i] ?? 0;
          const hIsBestSwell = checkBestSwell(point.bestSwell, hWDirStr, hPeriod);
          const hWindEffect = getWindEffect(point.beachFacing, hWindDirStr, hWindSpdMs);

          // 潮位: 天文潮汐計算（外部API不要・JMA調和定数使用）
          const tideHeight = computeTideHeight(new Date(time).getTime(), point.tideStation);

          return {
            time,
            waveHeight: hEffectiveHeight,
            rawWaveHeight: hSwellHeight,
            waveLabel: hWBase.label,
            waveRange: hWBase.range,
            period: hPeriod,
            windSpeed: hWindSpdMs,
            windDir: hWindDirStr,
            quality: calculateQuality(hWBase.score, hWindEffect, hIsBestSwell, hEffectiveHeight, hPeriod),
            tide: tideHeight
          };
        })
      : [];

    const dailyData = waveRes.daily?.time
      ? waveRes.daily.time.map((time: string, i: number) => {
          const dWaveHeightMax =
            waveRes.daily.wave_height_max_best_match?.[i] ??
            waveRes.daily.wave_height_max_gwam?.[i] ??
            waveRes.daily.wave_height_max?.[i] ??
            0;
          const dWaveDirDom =
            waveRes.daily.wave_direction_dominant_best_match?.[i] ??
            waveRes.daily.wave_direction_dominant_gwam?.[i] ??
            waveRes.daily.wave_direction_dominant?.[i] ??
            0;
          const dWindSpdMax = windRes.daily?.wind_speed_10m_max?.[i] ?? 0;
          const dWindDirDom = windRes.daily?.wind_direction_10m_dominant?.[i] ?? 0;
          const dWeatherCode = windRes.daily?.weather_code?.[i] ?? 0;

          const noonIndex = i * 24 + 12;
          const hourlySST =
            waveRes.hourly.sea_surface_temperature_marine_best_match ??
            waveRes.hourly.sea_surface_temperature_gwam ??
            waveRes.hourly.sea_surface_temperature;
          let dSST = 0;
          if (hourlySST?.length > 0) {
            const val = hourlySST[noonIndex] ?? hourlySST[0];
            dSST = val ?? 0;
          }

          const dWDirStr = degreesToDir(dWaveDirDom);
          const dEffectiveHeight = calculateEffectiveHeight(dWaveHeightMax, dWDirStr, point.beachFacing);
          const dWBase = getWaveBaseScore(dEffectiveHeight);
          const dWindDirStr = degreesToDir(dWindDirDom);
          const dIsBestSwell = checkBestSwell(point.bestSwell, dWDirStr, 0);
          const dWindEffect = getWindEffect(point.beachFacing, dWindDirStr, dWindSpdMax / 3.6);

          return {
            time,
            waveHeight: dEffectiveHeight,
            rawWaveHeight: dWaveHeightMax,
            waveLabel: dWBase.label,
            windSpeedMax: dWindSpdMax / 3.6,
            windDir: dWindDirStr,
            temperatureMax: dSST,
            temperatureMin: dSST,
            weatherCode: dWeatherCode,
            quality: calculateQuality(dWBase.score, dWindEffect, dIsBestSwell, dEffectiveHeight, 0)
          };
        })
      : [];

    const conditionSummary = generateConditionSummary({
      waveDirectionStr: convertWindDirection(waveDirStr),
      isBestSwell,
      effectiveHeight,
      waveLabel: waveBase.label,
      period: waveRes.current?.wave_period ?? 0,
      windDirStr,
      windSpeed: windSpeedMs,
      beachFacing: point.beachFacing,
    });

    return {
      id: point.id,
      beach: point.name,
      height: waveBase.label,
      heightMeters: effectiveHeight,
      rawSwellHeight: curWave,
      heightRange: waveBase.range,
      period: waveRes.current?.wave_period ?? 0,
      windSpeed: windSpeedMs,
      windDirection: windDirStr,
      waveDirectionStr: waveDirStr,
      waveDirectionDeg: curWaveDir,
      isBestSwell,
      beachFacing: point.beachFacing,
      temperature: curTemp,
      visibility: curVisibility,
      cloudCover: curCloudCover,
      conditionSummary,
      quality: finalQuality,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      nextUpdate: '1時間後',
      note: point.note,
      bestSwell: point.bestSwell,
      hourly: hourlyData,
      daily: dailyData
    };
  } catch (error) {
    console.error(`Error processing ${point.name}:`, error);
    return null;
  }
}

export async function GET(request: Request) {
  // クエリパラメータのバリデーション
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

  // spotId が指定された場合は該当ポイントのみ、なければ全ポイントを処理
  const targetPoints = spotId
    ? surfPoints.filter(p => p.id === spotId)
    : surfPoints;

  if (spotId && targetPoints.length === 0) {
    return NextResponse.json(
      { error: '指定されたスポットが見つかりません' },
      { status: 404 }
    );
  }

  // 並列処理で全ポイントのデータを取得（失敗したポイントはスキップ）
  const settled = await Promise.allSettled(targetPoints.map(point => processPoint(point)));

  const results = settled
    .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof processPoint>>>> =>
      r.status === 'fulfilled' && r.value !== null
    )
    .map(r => r.value);

  return NextResponse.json(results);
}
