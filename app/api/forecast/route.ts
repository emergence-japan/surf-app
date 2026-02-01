import { NextResponse } from 'next/server';
import { surfPoints } from '@/lib/surf-points';

// データの合成ロジック (GAS版の移植)
function coalesce(...args: (number | null | undefined)[]) {
  for (const arg of args) {
    if (arg !== null && arg !== undefined) return arg;
  }
  return null;
}

// 方位角を16方位の文字列に変換 (N, NNE, ...)
function degreesToDir(degrees: number | null): string {
  if (degrees === null) return '-';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const dirIndex = Math.round(((degrees % 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
  return dirs[dirIndex];
}

// ビーチでの有効な波高を計算 (うねりの向きとビーチの向きの差を考慮)
function calculateEffectiveHeight(swellHeight: number | null, swellDir: string, beachFacing: string): number {
  if (swellHeight === null) return 0;
  if (!swellDir || !beachFacing || swellDir === '-') return swellHeight;

  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const beachIdx = dirs.indexOf(beachFacing);
  const swellIdx = dirs.indexOf(swellDir);

  if (beachIdx === -1 || swellIdx === -1) return swellHeight;

  // 角度差を計算 (0-8ユニット, 1ユニット=22.5度)
  let diff = Math.abs(beachIdx - swellIdx);
  if (diff > 8) diff = 16 - diff;

  // 減衰率の決定
  let attenuation = 1.0;
  if (diff <= 1) { // 0 - 22.5度 (ほぼ正面)
    attenuation = 1.0;
  } else if (diff <= 2) { // 45度
    attenuation = 0.9;
  } else if (diff <= 3) { // 67.5度
    attenuation = 0.7;
  } else if (diff <= 4) { // 90度 (真横)
    attenuation = 0.5;
  } else { // 90度以上 (背後など)
    attenuation = 0.2;
  }

  return swellHeight * attenuation;
}

// 波高からベースのスコアとラベルを取得 (1-5のスコア)
function getWaveBaseScore(height: number | null) {
  if (height === null) return { score: 1, label: '-', range: '-' };

  if (height < 0.2) return { score: 1, label: 'フラット', range: '0.0-0.2m' };
  if (height < 0.5) return { score: 2, label: 'スネ〜ヒザ', range: '0.2-0.5m' };
  if (height < 0.8) return { score: 3, label: 'ヒザ〜腰', range: '0.5-0.8m' };
  if (height < 1.2) return { score: 4, label: '腰〜腹', range: '0.8-1.2m' };
  if (height < 1.6) return { score: 5, label: '腹〜胸', range: '1.2-1.6m' };
  if (height < 2.0) return { score: 4, label: '胸〜肩', range: '1.6-2.0m' };
  if (height < 2.5) return { score: 3, label: '肩〜頭', range: '2.0-2.5m' };
  return { score: 2, label: '頭オーバー', range: '2.5m+' };
}

// 風の影響を判定 (オフショア、オンショア、サイド)
function getWindEffect(beachFacing: string, windDir: string, windSpeed: number): number {
  if (!beachFacing || !windDir || windDir === '-') return 0;

  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const beachIdx = dirs.indexOf(beachFacing);
  const windIdx = dirs.indexOf(windDir);

  if (beachIdx === -1 || windIdx === -1) return 0;

  let diff = Math.abs(beachIdx - windIdx);
  if (diff > 8) diff = 16 - diff;

  // diff 0: 真オンショア, diff 8: 真オフショア
  if (diff >= 6) { // オフショア寄り (135度〜180度)
    return 1;
  } else if (diff <= 2) { // オンショア寄り (0度〜45度)
    return windSpeed > 4 ? -2 : -1; // 4m/s以上のオンショアは大幅減点
  }
  return 0; // サイドなど
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

// 1ポイント分の処理を行う関数
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
      fetch(windUrl).then(res => res.json()),
      fetch(waveUrl).then(res => res.json())
    ]);

    if (windRes.error || waveRes.error) {
      console.error(`Error fetching data for ${point.name}`, windRes, waveRes);
      return {
        id: point.id,
        beach: point.name,
        isError: true,
        windRes,
        waveRes
      };
    }

    // 現在時刻に最も近いインデックスを見つける (hourly.time は ISO8601 文字列)
    const now = new Date();
    // 時間ごとのデータ間隔は通常1時間。現在時刻に最も近い時間を探す
    // APIは過去7日+予報7日などを返すことがあるため、現在時刻との差が最小のものを探す
    let currentIndex = 0;
    let minDiff = Infinity;

    waveRes.hourly.time.forEach((timeStr: string, i: number) => {
      const time = new Date(timeStr);
      const diff = Math.abs(now.getTime() - time.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        currentIndex = i;
      }
    });

    let curWave = waveRes.current.wave_height;
    if (curWave === null && waveRes.hourly.wave_height_gwam) curWave = waveRes.hourly.wave_height_gwam[currentIndex];

    let curWaveDir = waveRes.current.wave_direction;
    if (curWaveDir === null && waveRes.hourly.wave_direction_gwam) curWaveDir = waveRes.hourly.wave_direction_gwam[currentIndex];

    let curWindSpd = windRes.current.wind_speed_10m;
    let curWindDir = windRes.current.wind_direction_10m;

    // 水温の取得ロジック修正
    // marine_best_match が存在する場合はそれを使用
    let curTemp = 0;
    if (waveRes.hourly.sea_surface_temperature_marine_best_match) {
      curTemp = waveRes.hourly.sea_surface_temperature_marine_best_match[currentIndex];
    } else if (waveRes.hourly.sea_surface_temperature_gwam) {
      curTemp = waveRes.hourly.sea_surface_temperature_gwam[currentIndex];
    } else if (waveRes.hourly.sea_surface_temperature) {
      curTemp = waveRes.hourly.sea_surface_temperature[currentIndex];
    }

    const curVisibility = windRes.current.visibility;
    const curCloudCover = windRes.current.cloud_cover;

    const windSpeedMs = curWindSpd !== null ? curWindSpd / 3.6 : 0;
    const windDirStr = degreesToDir(curWindDir);
    const waveDirStr = degreesToDir(curWaveDir);

    const effectiveHeight = calculateEffectiveHeight(curWave, waveDirStr, point.beachFacing);
    const waveBase = getWaveBaseScore(effectiveHeight);

    const isBestSwell = checkBestSwell(point.bestSwell, waveDirStr);
    const windEffect = getWindEffect(point.beachFacing, windDirStr, windSpeedMs);

    const finalQuality = calculateQuality(waveBase.score, windEffect, isBestSwell);

    const hWaveHeight = waveRes.hourly.wave_height_best_match || waveRes.hourly.wave_height_gwam || waveRes.hourly.wave_height;
    const hWavePeriod = waveRes.hourly.wave_period_best_match || waveRes.hourly.wave_period_gwam || waveRes.hourly.wave_period;
    const hWaveDir = waveRes.hourly.wave_direction_best_match || waveRes.hourly.wave_direction_gwam || waveRes.hourly.wave_direction;
    const hWindSpeed = windRes.hourly.wind_speed_10m_jma_msm || windRes.hourly.wind_speed_10m_gfs_seamless || windRes.hourly.wind_speed_10m;
    const hWindDir = windRes.hourly.wind_direction_10m_jma_msm || windRes.hourly.wind_direction_10m_gfs_seamless || windRes.hourly.wind_direction_10m;
    const hSeaLevel = waveRes.hourly.sea_level || waveRes.hourly.sea_level_best_match || waveRes.hourly.sea_level_gwam;

    const hourlyData = waveRes.hourly.time.map((time: string, i: number) => {
      const hSwellHeight = hWaveHeight[i];
      const hWDirStr = degreesToDir(hWaveDir[i]);
      const hEffectiveHeight = calculateEffectiveHeight(hSwellHeight, hWDirStr, point.beachFacing);
      const hWBase = getWaveBaseScore(hEffectiveHeight);
      const hWindDirStr = degreesToDir(hWindDir[i]);
      const hWindSpdMs = hWindSpeed[i] ? hWindSpeed[i] / 3.6 : 0;
      const hIsBestSwell = checkBestSwell(point.bestSwell, hWDirStr);
      const hWindEffect = getWindEffect(point.beachFacing, hWindDirStr, hWindSpdMs);

      // Calculate Tide (API or Simulation fallback)
      let tideHeight = 0;
      if (hSeaLevel && hSeaLevel[i] !== undefined && hSeaLevel[i] !== null) {
        tideHeight = hSeaLevel[i];
      } else {
        // Fallback: Approximate semidiurnal tide (M2) simulation
        // Period approx 12.4 hours. 
        const t = new Date(time).getTime();
        const hours = t / (1000 * 60 * 60);
        tideHeight = 0.5 * Math.cos(2 * Math.PI * (hours - 0) / 12.42);
      }

      return {
        time: time,
        waveHeight: hEffectiveHeight,
        rawWaveHeight: hSwellHeight,
        waveLabel: hWBase.label,
        waveRange: hWBase.range,
        period: hWavePeriod[i] || 0,
        windSpeed: hWindSpdMs,
        windDir: hWindDirStr,
        quality: calculateQuality(hWBase.score, hWindEffect, hIsBestSwell),
        tide: tideHeight
      };
    });

    const dailyData = waveRes.daily.time.map((time: string, i: number) => {
      const dWaveHeightMax = waveRes.daily.wave_height_max_best_match ? waveRes.daily.wave_height_max_best_match[i] : (waveRes.daily.wave_height_max_gwam ? waveRes.daily.wave_height_max_gwam[i] : (waveRes.daily.wave_height_max ? waveRes.daily.wave_height_max[i] : 0));
      const dWaveDirDom = waveRes.daily.wave_direction_dominant_best_match ? waveRes.daily.wave_direction_dominant_best_match[i] : (waveRes.daily.wave_direction_dominant_gwam ? waveRes.daily.wave_direction_dominant_gwam[i] : (waveRes.daily.wave_direction_dominant ? waveRes.daily.wave_direction_dominant[i] : 0));
      const dWindSpdMax = (windRes.daily?.wind_speed_10m_max && windRes.daily.wind_speed_10m_max[i] !== null && windRes.daily.wind_speed_10m_max[i] !== undefined) ? windRes.daily.wind_speed_10m_max[i] : 0;
      const dWindDirDom = (windRes.daily?.wind_direction_10m_dominant && windRes.daily.wind_direction_10m_dominant[i] !== null && windRes.daily.wind_direction_10m_dominant[i] !== undefined) ? windRes.daily.wind_direction_10m_dominant[i] : 0;
      const dWeatherCode = windRes.daily.weather_code ? windRes.daily.weather_code[i] : 0;
      const dTempMax = 0;

      const noonIndex = i * 24 + 12;
      let dSST = 0;

      // Try to get sea surface temperature (best_match, gwam, or generic)
      // Try to get sea surface temperature (marine_best_match, gwam, or generic)
      const hourlySST = waveRes.hourly.sea_surface_temperature_marine_best_match
        || waveRes.hourly.sea_surface_temperature_gwam
        || waveRes.hourly.sea_surface_temperature;

      if (hourlySST && hourlySST.length > 0) {
        // Try noon index, fallback to index 0, fallback to 0
        const val = hourlySST[noonIndex] !== undefined ? hourlySST[noonIndex] : hourlySST[0];
        dSST = val !== null && val !== undefined ? val : 0;
      }

      const dWDirStr = degreesToDir(dWaveDirDom);
      const dEffectiveHeight = calculateEffectiveHeight(dWaveHeightMax, dWDirStr, point.beachFacing);
      const dWBase = getWaveBaseScore(dEffectiveHeight);
      const dWindDirStr = degreesToDir(dWindDirDom);
      const dIsBestSwell = checkBestSwell(point.bestSwell, dWDirStr);
      // Daily wind is max speed, so standard might be stricter, but we use simple check for summary
      const dWindEffect = getWindEffect(point.beachFacing, dWindDirStr, dWindSpdMax / 3.6);
      const dQuality = calculateQuality(dWBase.score, dWindEffect, dIsBestSwell);

      return {
        time: time,
        waveHeight: dEffectiveHeight,
        rawWaveHeight: dWaveHeightMax,
        waveLabel: dWBase.label,
        windSpeedMax: dWindSpdMax / 3.6,
        windDir: dWindDirStr,
        temperatureMax: dSST, // Use SST as Max (it's constant-ish)
        temperatureMin: dSST, // Use SST as Min
        weatherCode: dWeatherCode,
        quality: dQuality
      };
    });

    return {
      id: point.id,
      beach: point.name,
      height: waveBase.label,
      heightMeters: effectiveHeight,
      rawSwellHeight: curWave, // 生のうねり高
      heightRange: waveBase.range,
      period: waveRes.current.wave_period || 0,
      windSpeed: windSpeedMs,
      windDirection: windDirStr,
      waveDirectionStr: waveDirStr,
      waveDirectionDeg: curWaveDir,
      isBestSwell: isBestSwell,
      beachFacing: point.beachFacing,
      temperature: curTemp || 0,
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
  const results = [];

  // 逐次処理に戻して確実にデータを取得する (並列化によるエラー回避)
  for (const point of surfPoints) {
    const data = await processPoint(point);
    if (data) {
      results.push(data);
    }
  }

  return NextResponse.json(results);
}