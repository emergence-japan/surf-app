import { surfPoints, type SurfPoint } from './surf-points';
import { computeTideHeight, computeTidePhase, getTideScoreEffect } from './tide-predictor';
import { convertWindDirection } from './converters';
import {
  degreesToDir,
  calculateEffectiveHeight,
  calculateBayEffectiveHeight,
  analyzeSwellComponents,
  applyBreakProfileHeightFactor,
  getWaveBaseScore,
  getWindEffect,
  calculateQuality,
  checkBestSwell,
  generateConditionSummary,
} from './wave-calculations';
import type { SurfPointDetail } from './types';

const FETCH_TIMEOUT_MS = 20000;

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
  } finally {
    clearTimeout(timer);
  }
}

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

// 2 モデルのスカラー値を平均する（片方欠損なら他方、両方欠損なら null）
// 風速など、線形に平均してよい量に使う。風向（角度）には使わない。
function avgPair(a: number | null | undefined, b: number | null | undefined): number | null {
  const av = a ?? null;
  const bv = b ?? null;
  if (av !== null && bv !== null) return Math.round(((av + bv) / 2) * 100) / 100;
  return av ?? bv ?? null;
}

async function fetchExternalData(point: SurfPoint) {
  const windUrl = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}`
    + `&current=wind_speed_10m,wind_direction_10m,visibility,cloud_cover`
    + `&hourly=wind_speed_10m,wind_direction_10m`
    + `&daily=wind_speed_10m_max,wind_direction_10m_dominant,weather_code`
    // 波と同様に風も2モデルをアンサンブル平均して外れを抑える
    // （日本周辺の高解像度 JMA MSM と全球 GFS）
    + `&models=jma_msm,gfs_seamless`
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
    fetchWithTimeout(waveUrl).then(res => res.json()),
  ]);

  if (windRes.error) throw new Error(`wind API error: ${windRes.reason ?? 'unknown'}`);
  if (waveRes.error) throw new Error(`wave API error: ${waveRes.reason ?? 'unknown'}`);
  if (!waveRes.hourly?.time || !Array.isArray(waveRes.hourly.time) || waveRes.hourly.time.length === 0) {
    throw new Error('wave API returned empty hourly.time');
  }

  return { windRes, waveRes };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveCurrentConditions(windRes: any, waveRes: any, currentIndex: number, point: SurfPoint) {
  let curWave = waveRes.current?.wave_height ?? null;
  if (curWave === null && waveRes.hourly.wave_height_gwam) curWave = waveRes.hourly.wave_height_gwam[currentIndex] ?? null;

  let curWaveDir = waveRes.current?.wave_direction ?? null;
  if (curWaveDir === null && waveRes.hourly.wave_direction_gwam) curWaveDir = waveRes.hourly.wave_direction_gwam[currentIndex] ?? null;

  // 注: open-meteo の current は複数モデル指定でもサフィックスなしの単一値
  // （best_match 相当）しか返さない。current は単一値で扱う。
  // hourly / daily は 2 モデルを平均する（buildHourlyData / buildDailyData 参照）。
  const cw = windRes.current ?? {};
  const curWindSpd = cw.wind_speed_10m ?? null;
  const curWindDir = cw.wind_direction_10m ?? null;

  // 水温: 欠損時は 0℃ ではなく null（不明）にする。0℃ を実在値として表示しない。
  let curTemp: number | null = null;
  const sstSources = [
    waveRes.hourly.sea_surface_temperature_marine_best_match,
    waveRes.hourly.sea_surface_temperature_gwam,
    waveRes.hourly.sea_surface_temperature,
  ];
  for (const src of sstSources) {
    if (src && src[currentIndex] !== null && src[currentIndex] !== undefined) {
      curTemp = src[currentIndex];
      break;
    }
  }

  const curVisibility = windRes.current?.visibility ?? null;
  const curCloudCover = windRes.current?.cloud_cover ?? null;
  const windSpeedMs = curWindSpd !== null ? curWindSpd / 3.6 : 0;
  const windDirStr = degreesToDir(curWindDir);
  const waveDirStr = degreesToDir(curWaveDir);

  const curSwellHeight    = waveRes.current?.swell_wave_height ?? null;
  const curSwellDir       = waveRes.current?.swell_wave_direction ?? null;
  const curSwellPeriod    = waveRes.current?.swell_wave_period ?? null;
  const curWindWaveHeight = waveRes.current?.wind_wave_height ?? null;
  const curWindWaveDir    = waveRes.current?.wind_wave_direction ?? null;
  const curWindWavePeriod = waveRes.current?.wind_wave_period ?? null;

  const hasSwellData = curSwellHeight !== null || curWindWaveHeight !== null;
  const swellAnalysis = hasSwellData
    ? analyzeSwellComponents({ swellHeight: curSwellHeight, swellDir: curSwellDir, swellPeriod: curSwellPeriod, windWaveHeight: curWindWaveHeight, windWaveDir: curWindWaveDir, windWavePeriod: curWindWavePeriod, beachFacing: point.beachFacing, bayGeometry: point.bayGeometry })
    : null;

  const rawEffectiveHeight = swellAnalysis
    ? swellAnalysis.combinedEffectiveHeight
    : (point.bayGeometry
        ? calculateBayEffectiveHeight(curWave, waveDirStr, point.beachFacing, waveRes.current?.wave_period ?? null, point.bayGeometry)
        : calculateEffectiveHeight(curWave, waveDirStr, point.beachFacing, waveRes.current?.wave_period));

  const curPeriod = swellAnalysis ? swellAnalysis.dominantPeriod : (waveRes.current?.wave_period ?? 0);
  const effectiveHeight = applyBreakProfileHeightFactor(rawEffectiveHeight, curPeriod, point.breakProfile);
  const waveBase = getWaveBaseScore(effectiveHeight);
  const dominantDirStr = swellAnalysis ? swellAnalysis.dominantDirStr : waveDirStr;
  const swellDirStr = swellAnalysis ? degreesToDir(curSwellDir) : waveDirStr;
  const swellPeriod = curSwellPeriod ?? curPeriod;
  const isBestSwell = checkBestSwell(point.bestSwell, swellDirStr, swellPeriod) && waveBase.score >= 3 && windSpeedMs <= 5;
  const windEffect = getWindEffect(point.beachFacing, windDirStr, windSpeedMs);
  const curTideScoreEffect = getTideScoreEffect(computeTidePhase(Date.now(), point.tideStation), point.tidePreference);
  const finalQuality = calculateQuality(waveBase.score, windEffect, isBestSwell, effectiveHeight, curPeriod, swellAnalysis?.isSwellDominant, curTideScoreEffect, 'short', point.breakProfile);

  return {
    curWave, curWaveDir, curTemp, curVisibility, curCloudCover,
    curSwellDir, curSwellPeriod, windSpeedMs, windDirStr,
    swellAnalysis, effectiveHeight, waveBase, curPeriod, dominantDirStr,
    isBestSwell, finalQuality,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildHourlyData(waveRes: any, windRes: any, point: SurfPoint) {
  const hWaveHeight = ensembleAvg(waveRes.hourly.wave_height_marine_best_match, waveRes.hourly.wave_height_gwam, waveRes.hourly.wave_height);
  const hWavePeriod = ensembleAvg(waveRes.hourly.wave_period_marine_best_match, waveRes.hourly.wave_period_gwam, waveRes.hourly.wave_period);
  const hWaveDir: (number | null)[] | null = waveRes.hourly.wave_direction_marine_best_match ?? waveRes.hourly.wave_direction_gwam ?? waveRes.hourly.wave_direction ?? null;
  // 風速は 2 モデル平均、風向は JMA MSM 優先（角度は平均できない）
  const hWindSpeed: (number | null)[] | null = ensembleAvg(windRes.hourly?.wind_speed_10m_jma_msm, windRes.hourly?.wind_speed_10m_gfs_seamless, windRes.hourly?.wind_speed_10m);
  const hWindDir: (number | null)[] | null = windRes.hourly?.wind_direction_10m_jma_msm ?? windRes.hourly?.wind_direction_10m_gfs_seamless ?? windRes.hourly?.wind_direction_10m ?? null;
  const hSwellHeight = ensembleAvg(waveRes.hourly.swell_wave_height_marine_best_match, waveRes.hourly.swell_wave_height_gwam, waveRes.hourly.swell_wave_height);
  const hSwellDir: (number | null)[] | null = waveRes.hourly.swell_wave_direction_marine_best_match ?? waveRes.hourly.swell_wave_direction_gwam ?? waveRes.hourly.swell_wave_direction ?? null;
  const hSwellPeriod = ensembleAvg(waveRes.hourly.swell_wave_period_marine_best_match, waveRes.hourly.swell_wave_period_gwam, waveRes.hourly.swell_wave_period);
  const hWindWaveHeight = ensembleAvg(waveRes.hourly.wind_wave_height_marine_best_match, waveRes.hourly.wind_wave_height_gwam, waveRes.hourly.wind_wave_height);
  const hWindWaveDir: (number | null)[] | null = waveRes.hourly.wind_wave_direction_marine_best_match ?? waveRes.hourly.wind_wave_direction_gwam ?? waveRes.hourly.wind_wave_direction ?? null;
  const hWindWavePeriod = ensembleAvg(waveRes.hourly.wind_wave_period_marine_best_match, waveRes.hourly.wind_wave_period_gwam, waveRes.hourly.wind_wave_period);

  if (!hWaveHeight) return [];

  return waveRes.hourly.time.map((time: string, i: number) => {
    const hRawHeight = hWaveHeight[i] ?? null;
    const hWDirStr = degreesToDir(hWaveDir?.[i]);
    const hWindDirStr = degreesToDir(hWindDir?.[i]);
    const hWindSpdMs = (hWindSpeed?.[i] ?? 0) / 3.6;
    const hHasSwellData = hSwellHeight !== null || hWindWaveHeight !== null;
    const hSwellAnalysis = hHasSwellData
      ? analyzeSwellComponents({ swellHeight: hSwellHeight?.[i] ?? null, swellDir: hSwellDir?.[i] ?? null, swellPeriod: hSwellPeriod?.[i] ?? null, windWaveHeight: hWindWaveHeight?.[i] ?? null, windWaveDir: hWindWaveDir?.[i] ?? null, windWavePeriod: hWindWavePeriod?.[i] ?? null, beachFacing: point.beachFacing, bayGeometry: point.bayGeometry })
      : null;

    const hPeriod = hSwellAnalysis ? hSwellAnalysis.dominantPeriod : (hWavePeriod?.[i] ?? 0);
    const hRawEffectiveHeight = hSwellAnalysis ? hSwellAnalysis.combinedEffectiveHeight : (point.bayGeometry ? calculateBayEffectiveHeight(hRawHeight, hWDirStr, point.beachFacing, hWavePeriod?.[i] ?? null, point.bayGeometry) : calculateEffectiveHeight(hRawHeight, hWDirStr, point.beachFacing, hWavePeriod?.[i]));
    const hEffectiveHeight = applyBreakProfileHeightFactor(hRawEffectiveHeight, hPeriod, point.breakProfile);
    const hWBase = getWaveBaseScore(hEffectiveHeight);
    const hSwellDirStr = hSwellAnalysis ? degreesToDir(hSwellDir?.[i]) : hWDirStr;
    const hSwellPer = hSwellPeriod?.[i] ?? hPeriod;
    const hIsBestSwell = checkBestSwell(point.bestSwell, hSwellDirStr, hSwellPer) && hWBase.score >= 3 && hWindSpdMs <= 5;
    const hWindEffect = getWindEffect(point.beachFacing, hWindDirStr, hWindSpdMs);
    const tMs = new Date(time).getTime();
    const hTideScoreEffect = getTideScoreEffect(computeTidePhase(tMs, point.tideStation), point.tidePreference);

    return {
      time,
      waveHeight: hEffectiveHeight,
      rawWaveHeight: hRawHeight,
      waveLabel: hWBase.label,
      waveRange: hWBase.range,
      period: hPeriod,
      windSpeed: hWindSpdMs,
      windDir: hWindDirStr,
      quality: calculateQuality(hWBase.score, hWindEffect, hIsBestSwell, hEffectiveHeight, hPeriod, hSwellAnalysis?.isSwellDominant, hTideScoreEffect, 'short', point.breakProfile),
      tide: computeTideHeight(tMs, point.tideStation),
      swellHeight: hSwellAnalysis?.effectiveSwellHeight,
      windWaveHeight: hSwellAnalysis?.effectiveWindWaveHeight,
      isSwellDominant: hSwellAnalysis?.isSwellDominant,
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDailyData(waveRes: any, windRes: any, point: SurfPoint) {
  if (!waveRes.daily?.time) return [];

  return waveRes.daily.time.map((time: string, i: number) => {
    const dWaveHeightMax = waveRes.daily.wave_height_max_best_match?.[i] ?? waveRes.daily.wave_height_max_gwam?.[i] ?? waveRes.daily.wave_height_max?.[i] ?? 0;
    const dWaveDirDom    = waveRes.daily.wave_direction_dominant_best_match?.[i] ?? waveRes.daily.wave_direction_dominant_gwam?.[i] ?? waveRes.daily.wave_direction_dominant?.[i] ?? 0;
    // 風は 2 モデル: 最大風速は平均、卓越風向と天気コードは JMA MSM 優先
    const wd = windRes.daily ?? {};
    const dWindSpdMax    = avgPair(wd.wind_speed_10m_max_jma_msm?.[i], wd.wind_speed_10m_max_gfs_seamless?.[i]) ?? wd.wind_speed_10m_max?.[i] ?? 0;
    const dWindDirDom    = wd.wind_direction_10m_dominant_jma_msm?.[i] ?? wd.wind_direction_10m_dominant_gfs_seamless?.[i] ?? wd.wind_direction_10m_dominant?.[i] ?? 0;
    const dWeatherCode   = wd.weather_code_jma_msm?.[i] ?? wd.weather_code_gfs_seamless?.[i] ?? wd.weather_code?.[i] ?? 0;

    const noonIndex = i * 24 + 12;
    const hourlySST = waveRes.hourly.sea_surface_temperature_marine_best_match ?? waveRes.hourly.sea_surface_temperature_gwam ?? waveRes.hourly.sea_surface_temperature;
    // 水温: 欠損時は null（不明）。0℃ を実在値として埋めない。
    const dSSTRaw = hourlySST?.length > 0 ? (hourlySST[noonIndex] ?? hourlySST[0] ?? null) : null;
    const dSST: number | null = dSSTRaw ?? null;

    // 日次APIには周期データがないため、その日の正午のhourly周期を代表値として使用
    const hourlySwellPeriod = waveRes.hourly.swell_wave_period_marine_best_match ?? waveRes.hourly.swell_wave_period_gwam ?? waveRes.hourly.swell_wave_period;
    const hourlyWavePeriod = waveRes.hourly.wave_period_marine_best_match ?? waveRes.hourly.wave_period_gwam ?? waveRes.hourly.wave_period;
    const dPeriod = hourlySwellPeriod?.[noonIndex] ?? hourlyWavePeriod?.[noonIndex] ?? 0;

    const dWDirStr = degreesToDir(dWaveDirDom);
    const dRawEffectiveHeight = point.bayGeometry
      ? calculateBayEffectiveHeight(dWaveHeightMax, dWDirStr, point.beachFacing, null, point.bayGeometry)
      : calculateEffectiveHeight(dWaveHeightMax, dWDirStr, point.beachFacing);
    const dEffectiveHeight = applyBreakProfileHeightFactor(dRawEffectiveHeight, dPeriod, point.breakProfile);
    const dWBase = getWaveBaseScore(dEffectiveHeight);
    const dWindDirStr = degreesToDir(dWindDirDom);
    const dIsBestSwell = checkBestSwell(point.bestSwell, dWDirStr, dPeriod);
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
      quality: calculateQuality(dWBase.score, dWindEffect, dIsBestSwell, dEffectiveHeight, dPeriod, undefined, undefined, 'short', point.breakProfile),
    };
  });
}

export async function fetchPointForecast(point: SurfPoint): Promise<SurfPointDetail> {
  const { windRes, waveRes } = await fetchExternalData(point);

  const now = new Date();
  let currentIndex = 0;
  let minDiff = Infinity;
  waveRes.hourly.time.forEach((timeStr: string, i: number) => {
    const diff = Math.abs(now.getTime() - new Date(timeStr).getTime());
    if (diff < minDiff) { minDiff = diff; currentIndex = i; }
  });

  const cur = resolveCurrentConditions(windRes, waveRes, currentIndex, point);
  const hourly = buildHourlyData(waveRes, windRes, point);
  const daily = buildDailyData(waveRes, windRes, point);

  const conditionSummary = generateConditionSummary({
    waveDirectionStr: convertWindDirection(cur.dominantDirStr),
    isBestSwell: cur.isBestSwell,
    effectiveHeight: cur.effectiveHeight,
    waveLabel: cur.waveBase.label,
    period: cur.curPeriod,
    windDirStr: cur.windDirStr,
    windSpeed: cur.windSpeedMs,
    beachFacing: point.beachFacing,
  });

  return {
    id: point.id,
    beach: point.name,
    height: cur.waveBase.label,
    heightMeters: cur.effectiveHeight,
    heightValue: cur.effectiveHeight,
    rawSwellHeight: cur.curWave,
    heightRange: cur.waveBase.range,
    period: cur.curPeriod,
    windSpeed: cur.windSpeedMs,
    windDirection: cur.windDirStr,
    waveDirectionStr: cur.dominantDirStr,
    waveDirectionDeg: cur.curWaveDir ?? 0,
    isBestSwell: cur.isBestSwell,
    beachFacing: point.beachFacing,
    breakProfile: point.breakProfile,
    temperature: cur.curTemp,
    visibility: cur.curVisibility,
    cloudCover: cur.curCloudCover,
    conditionSummary,
    quality: cur.finalQuality,
    swellHeight: cur.swellAnalysis?.effectiveSwellHeight,
    swellDirStr: cur.swellAnalysis ? degreesToDir(cur.curSwellDir) : undefined,
    swellPeriod: cur.curSwellPeriod ?? undefined,
    windWaveHeight: cur.swellAnalysis?.effectiveWindWaveHeight,
    isSwellDominant: cur.swellAnalysis?.isSwellDominant,
    hourly,
    daily,
  };
}

export { surfPoints };
