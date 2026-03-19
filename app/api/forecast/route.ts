import { NextResponse } from 'next/server';
import { z } from 'zod';
import { surfPoints } from '@/lib/surf-points';
import { computeTideHeight, computeTidePhase, getTideScoreEffect } from '@/lib/tide-predictor';
import { convertWindDirection } from '@/lib/converters';
import {
  degreesToDir,
  calculateEffectiveHeight,
  analyzeSwellComponents,
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

// fetchタイムアウト付きラッパー（1時間fetchキャッシュ付き）
async function fetchWithTimeout(url: string, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 },   // 1時間キャッシュ: APIタイムアウト時も古いデータでスポット表示を保証
    });
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
      + `,swell_wave_height,swell_wave_direction,swell_wave_period`
      + `,wind_wave_height,wind_wave_direction,wind_wave_period`
      + `&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature`
      + `,swell_wave_height,swell_wave_direction,swell_wave_period`
      + `,wind_wave_height,wind_wave_direction,wind_wave_period`
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

    // スウェル成分の分離解析
    const curSwellHeight = waveRes.current?.swell_wave_height ?? null;
    const curSwellDir    = waveRes.current?.swell_wave_direction ?? null;
    const curSwellPeriod = waveRes.current?.swell_wave_period ?? null;
    const curWindWaveHeight = waveRes.current?.wind_wave_height ?? null;
    const curWindWaveDir    = waveRes.current?.wind_wave_direction ?? null;
    const curWindWavePeriod = waveRes.current?.wind_wave_period ?? null;

    const hasSwellData = curSwellHeight !== null || curWindWaveHeight !== null;

    const swellAnalysis = hasSwellData
      ? analyzeSwellComponents({
          swellHeight: curSwellHeight,
          swellDir:    curSwellDir,
          swellPeriod: curSwellPeriod,
          windWaveHeight: curWindWaveHeight,
          windWaveDir:    curWindWaveDir,
          windWavePeriod: curWindWavePeriod,
          beachFacing: point.beachFacing,
        })
      : null;

    // 有効波高: スウェル分離データがあれば合成値を、なければ従来計算を使用
    const effectiveHeight = swellAnalysis
      ? swellAnalysis.combinedEffectiveHeight
      : calculateEffectiveHeight(curWave, waveDirStr, point.beachFacing, waveRes.current?.wave_period);

    const waveBase = getWaveBaseScore(effectiveHeight);

    // 周期・方向: スウェル分離データがあればドミナント成分を優先
    const curPeriod = swellAnalysis
      ? swellAnalysis.dominantPeriod
      : (waveRes.current?.wave_period ?? 0);
    const dominantDirStr = swellAnalysis ? swellAnalysis.dominantDirStr : waveDirStr;

    // isBestSwell: スウェル方向で判定（分離データがある場合はスウェル成分のみ）
    const swellDirStr = swellAnalysis ? degreesToDir(curSwellDir) : waveDirStr;
    const swellPeriod = curSwellPeriod ?? curPeriod;
    const isBestSwell = checkBestSwell(point.bestSwell, swellDirStr, swellPeriod)
      && waveBase.score >= 3
      && windSpeedMs <= 5;

    const windEffect = getWindEffect(point.beachFacing, windDirStr, windSpeedMs);

    // 潮汐フェーズ補正（現在時刻）
    const curTidePhase = computeTidePhase(now.getTime(), point.tideStation);
    const curTideScoreEffect = getTideScoreEffect(curTidePhase);

    const finalQuality = calculateQuality(
      waveBase.score, windEffect, isBestSwell, effectiveHeight, curPeriod,
      swellAnalysis?.isSwellDominant,
      curTideScoreEffect
    );

    // hourlyデータのフォールバックチェーン（null安全）
    // marine APIはmodels=best_match,gwam指定時にmodel固有フィールド名を使用する
    // best_matchモデルのフィールド名は "wave_height_marine_best_match"
    // アンサンブル平均ヘルパー: 両モデルの値が揃っている場合は平均値を返す
    function ensembleAvg(
      a: (number | null)[] | undefined,
      b: (number | null)[] | undefined,
      fallback: (number | null)[] | undefined
    ): (number | null)[] | null {
      if (a && b && a.length === b.length) {
        return a.map((v, i) => {
          const bv = b[i];
          if (v !== null && bv !== null) return Math.round(((v + bv) / 2) * 100) / 100;
          return v ?? bv ?? null;
        });
      }
      return a ?? b ?? fallback ?? null;
    }

    const hWaveHeight: (number | null)[] | null = ensembleAvg(
      waveRes.hourly.wave_height_marine_best_match,
      waveRes.hourly.wave_height_gwam,
      waveRes.hourly.wave_height
    );

    const hWavePeriod: (number | null)[] | null = ensembleAvg(
      waveRes.hourly.wave_period_marine_best_match,
      waveRes.hourly.wave_period_gwam,
      waveRes.hourly.wave_period
    );

    const hWaveDir: (number | null)[] | null =
      waveRes.hourly.wave_direction_marine_best_match ??
      waveRes.hourly.wave_direction_gwam ??
      waveRes.hourly.wave_direction ??
      null; // 方向は平均ではなく優先モデルを使用

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

    // hourlyスウェル成分（アンサンブル平均）
    const hSwellHeight: (number | null)[] | null = ensembleAvg(
      waveRes.hourly.swell_wave_height_marine_best_match,
      waveRes.hourly.swell_wave_height_gwam,
      waveRes.hourly.swell_wave_height
    );
    const hSwellDir: (number | null)[] | null =
      waveRes.hourly.swell_wave_direction_marine_best_match ??
      waveRes.hourly.swell_wave_direction_gwam ??
      waveRes.hourly.swell_wave_direction ??
      null;
    const hSwellPeriod: (number | null)[] | null = ensembleAvg(
      waveRes.hourly.swell_wave_period_marine_best_match,
      waveRes.hourly.swell_wave_period_gwam,
      waveRes.hourly.swell_wave_period
    );
    const hWindWaveHeight: (number | null)[] | null = ensembleAvg(
      waveRes.hourly.wind_wave_height_marine_best_match,
      waveRes.hourly.wind_wave_height_gwam,
      waveRes.hourly.wind_wave_height
    );
    const hWindWaveDir: (number | null)[] | null =
      waveRes.hourly.wind_wave_direction_marine_best_match ??
      waveRes.hourly.wind_wave_direction_gwam ??
      waveRes.hourly.wind_wave_direction ??
      null;
    const hWindWavePeriod: (number | null)[] | null = ensembleAvg(
      waveRes.hourly.wind_wave_period_marine_best_match,
      waveRes.hourly.wind_wave_period_gwam,
      waveRes.hourly.wind_wave_period
    );

    const hourlyData = hWaveHeight
      ? waveRes.hourly.time.map((time: string, i: number) => {
          const hRawHeight = hWaveHeight[i] ?? null;
          const hWDirStr = degreesToDir(hWaveDir?.[i]);
          const hWindDirStr = degreesToDir(hWindDir?.[i]);
          const hWindSpdMs = (hWindSpeed?.[i] ?? null) !== null ? (hWindSpeed![i]! / 3.6) : 0;

          // スウェル分離解析
          const hHasSwellData = hSwellHeight !== null || hWindWaveHeight !== null;
          const hSwellAnalysis = hHasSwellData
            ? analyzeSwellComponents({
                swellHeight:    hSwellHeight?.[i] ?? null,
                swellDir:       hSwellDir?.[i] ?? null,
                swellPeriod:    hSwellPeriod?.[i] ?? null,
                windWaveHeight: hWindWaveHeight?.[i] ?? null,
                windWaveDir:    hWindWaveDir?.[i] ?? null,
                windWavePeriod: hWindWavePeriod?.[i] ?? null,
                beachFacing: point.beachFacing,
              })
            : null;

          const hEffectiveHeight = hSwellAnalysis
            ? hSwellAnalysis.combinedEffectiveHeight
            : calculateEffectiveHeight(hRawHeight, hWDirStr, point.beachFacing, hWavePeriod?.[i]);

          const hWBase = getWaveBaseScore(hEffectiveHeight);
          const hPeriod = hSwellAnalysis ? hSwellAnalysis.dominantPeriod : (hWavePeriod?.[i] ?? 0);

          const hSwellDirStr = hSwellAnalysis
            ? degreesToDir(hSwellDir?.[i])
            : hWDirStr;
          const hSwellPer = hSwellPeriod?.[i] ?? hPeriod;
          const hIsBestSwell = checkBestSwell(point.bestSwell, hSwellDirStr, hSwellPer)
            && hWBase.score >= 3
            && hWindSpdMs <= 5;
          const hWindEffect = getWindEffect(point.beachFacing, hWindDirStr, hWindSpdMs);

          // 潮位と潮汐フェーズ: 天文潮汐計算（外部API不要・JMA調和定数使用）
          const tMs = new Date(time).getTime();
          const tideHeight = computeTideHeight(tMs, point.tideStation);
          const hTidePhase = computeTidePhase(tMs, point.tideStation);
          const hTideScoreEffect = getTideScoreEffect(hTidePhase);

          return {
            time,
            waveHeight: hEffectiveHeight,
            rawWaveHeight: hRawHeight,
            waveLabel: hWBase.label,
            waveRange: hWBase.range,
            period: hPeriod,
            windSpeed: hWindSpdMs,
            windDir: hWindDirStr,
            quality: calculateQuality(
              hWBase.score, hWindEffect, hIsBestSwell, hEffectiveHeight, hPeriod,
              hSwellAnalysis?.isSwellDominant,
              hTideScoreEffect
            ),
            tide: tideHeight,
            swellHeight:     hSwellAnalysis?.effectiveSwellHeight,
            windWaveHeight:  hSwellAnalysis?.effectiveWindWaveHeight,
            isSwellDominant: hSwellAnalysis?.isSwellDominant,
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
      waveDirectionStr: convertWindDirection(dominantDirStr),
      isBestSwell,
      effectiveHeight,
      waveLabel: waveBase.label,
      period: curPeriod,
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
      period: curPeriod,
      windSpeed: windSpeedMs,
      windDirection: windDirStr,
      waveDirectionStr: dominantDirStr,
      waveDirectionDeg: curWaveDir ?? 0,
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
      // スウェル分離データ
      swellHeight:     swellAnalysis?.effectiveSwellHeight,
      swellDirStr:     swellAnalysis ? degreesToDir(curSwellDir) : undefined,
      swellPeriod:     curSwellPeriod ?? undefined,
      windWaveHeight:  swellAnalysis?.effectiveWindWaveHeight,
      isSwellDominant: swellAnalysis?.isSwellDominant,
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
