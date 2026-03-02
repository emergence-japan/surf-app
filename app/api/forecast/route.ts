import { NextResponse } from 'next/server';
import { surfPoints } from '@/lib/surf-points';
import { computeTideHeight } from '@/lib/tide-predictor';

// 1時間キャッシュ
export const revalidate = 3600;

// 16方位の定数（重複定義を排除）
const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'] as const;

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

// 方位角を16方位の文字列に変換
function degreesToDir(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined) return '-';
  const dirIndex = Math.round(((degrees % 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
  return DIRS[dirIndex];
}

// ビーチでの有効な波高を計算
// - cos関数で物理的に正確な角度減衰を計算
// - 周期が長いほど屈折でビーチに届きやすいため実効角度を補正
function calculateEffectiveHeight(
  swellHeight: number | null | undefined,
  swellDir: string,
  beachFacing: string,
  period?: number | null
): number {
  if (swellHeight === null || swellHeight === undefined) return 0;
  if (!swellDir || !beachFacing || swellDir === '-') return swellHeight;

  const beachIdx = DIRS.indexOf(beachFacing as typeof DIRS[number]);
  const swellIdx = DIRS.indexOf(swellDir as typeof DIRS[number]);

  if (beachIdx === -1 || swellIdx === -1) return swellHeight;

  let diff = Math.abs(beachIdx - swellIdx);
  if (diff > 8) diff = 16 - diff;

  // 角度差（度数）
  let angleDeg = diff * 22.5;

  // 周期による実効角度の補正
  // 長周期うねりは屈折により斜め方向でもビーチに届きやすい
  // 短周期風波は局所的で角度の影響を受けやすい
  if (period !== null && period !== undefined && period > 0) {
    if (period >= 14) {
      angleDeg *= 0.70; // 長周期（14秒+）: 実効角度を30%縮小
    } else if (period >= 12) {
      angleDeg *= 0.85; // 中長周期（12〜14秒）
    } else if (period <= 6) {
      angleDeg *= 1.15; // 短周期（〜6秒）: 実効角度をやや拡大
    } else if (period <= 8) {
      angleDeg *= 1.05; // やや短め（6〜8秒）
    }
    angleDeg = Math.min(angleDeg, 180);
  }

  // cos関数で減衰（物理的に正確）
  // 最小値0.05: 地形的な回折による微小な影響を考慮
  const angleRad = (angleDeg * Math.PI) / 180;
  const attenuation = Math.max(0.05, Math.cos(angleRad));

  return swellHeight * attenuation;
}

// 波高からベースのスコアとラベルを取得
function getWaveBaseScore(height: number | null | undefined) {
  if (height === null || height === undefined) return { score: 1, label: '-', range: '-' };

  if (height < 0.2) return { score: 1, label: 'フラット', range: '0.0-0.2m' };
  if (height < 0.5) return { score: 2, label: 'スネ〜ヒザ', range: '0.2-0.5m' };
  if (height < 0.8) return { score: 3, label: 'ヒザ〜腰', range: '0.5-0.8m' };
  if (height < 1.2) return { score: 4, label: '腰〜腹', range: '0.8-1.2m' };
  if (height < 1.6) return { score: 5, label: '腹〜胸', range: '1.2-1.6m' };
  if (height < 2.0) return { score: 4, label: '胸〜肩', range: '1.6-2.0m' };
  if (height < 2.5) return { score: 3, label: '肩〜頭', range: '2.0-2.5m' };
  return { score: 2, label: '頭オーバー', range: '2.5m+' };
}

// 風の影響を判定
// diff: ビーチ向きと風向きの方位インデックス差（0=真オンショア、8=真オフショア）
function getWindEffect(beachFacing: string, windDir: string, windSpeed: number): number {
  if (!beachFacing || !windDir || windDir === '-') return 0;

  const beachIdx = DIRS.indexOf(beachFacing as typeof DIRS[number]);
  const windIdx = DIRS.indexOf(windDir as typeof DIRS[number]);

  if (beachIdx === -1 || windIdx === -1) return 0;

  let diff = Math.abs(beachIdx - windIdx);
  if (diff > 8) diff = 16 - diff;

  // オフショア（135°〜180°: diff 6〜8）
  // 8 m/s 超は波が吹き上げられて恩恵なし
  if (diff >= 6) {
    return windSpeed > 8 ? 0 : 1;
  }

  // サイドショア（67.5°〜112.5°: diff 3〜5）
  // 強風になると波面が乱れてマイナス
  if (diff >= 3) {
    return windSpeed > 7 ? -1 : 0;
  }

  // オンショア（0°〜45°: diff 0〜2）
  // 5 m/s を超えると急激に波質が悪化する
  if (windSpeed > 8) return -3;
  if (windSpeed > 5) return -2;
  if (windSpeed > 3) return -1;
  return 0;
}

// 最終的なQualityを決定
function calculateQuality(baseScore: number, windEffect: number, isBestSwell: boolean): 'S' | 'A' | 'B' | 'C' | 'D' {
  let finalScore = baseScore + windEffect;
  if (isBestSwell) finalScore += 1;

  if (finalScore >= 5) return 'S';
  if (finalScore >= 4) return 'A';
  if (finalScore >= 3) return 'B';
  if (finalScore >= 2) return 'C';
  return 'D';
}

// ベストスウェル判定
function checkBestSwell(bestSwell: string | undefined, currentDirStr: string): boolean {
  if (!bestSwell || !currentDirStr || currentDirStr === '-') return false;
  const candidates = bestSwell.toUpperCase().split(/[\s,、・]+/);
  return candidates.includes(currentDirStr.toUpperCase());
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
    const isBestSwell = checkBestSwell(point.bestSwell, waveDirStr);
    const windEffect = getWindEffect(point.beachFacing, windDirStr, windSpeedMs);
    const finalQuality = calculateQuality(waveBase.score, windEffect, isBestSwell);

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
          const hIsBestSwell = checkBestSwell(point.bestSwell, hWDirStr);
          const hWindEffect = getWindEffect(point.beachFacing, hWindDirStr, hWindSpdMs);

          // 潮位: 天文潮汐計算（外部API不要・JMA調和定数使用）
          const tideHeight = computeTideHeight(new Date(time).getTime(), point.tideStation);

          return {
            time,
            waveHeight: hEffectiveHeight,
            rawWaveHeight: hSwellHeight,
            waveLabel: hWBase.label,
            waveRange: hWBase.range,
            period: hWavePeriod?.[i] ?? 0,
            windSpeed: hWindSpdMs,
            windDir: hWindDirStr,
            quality: calculateQuality(hWBase.score, hWindEffect, hIsBestSwell),
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
          const dIsBestSwell = checkBestSwell(point.bestSwell, dWDirStr);
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
            quality: calculateQuality(dWBase.score, dWindEffect, dIsBestSwell)
          };
        })
      : [];

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

export async function GET() {
  // 並列処理で全ポイントのデータを取得（失敗したポイントはスキップ）
  const settled = await Promise.allSettled(surfPoints.map(point => processPoint(point)));

  const results = settled
    .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof processPoint>>>> =>
      r.status === 'fulfilled' && r.value !== null
    )
    .map(r => r.value);

  return NextResponse.json(results);
}
