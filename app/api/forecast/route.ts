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
    attenuation = 0.8;
  } else if (diff <= 3) { // 67.5度
    attenuation = 0.5;
  } else if (diff <= 4) { // 90度 (真横)
    attenuation = 0.3;
  } else { // 90度以上 (背後など)
    attenuation = 0.1;
  }

  // 周期（Period）が長いほど、回り込みやすいため少し補正を入れることも可能ですが、まずはシンプルに。
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
function calculateQuality(baseScore: number, windEffect: number, isBestSwell: boolean): 'excellent' | 'good' | 'fair' | 'poor' {
  let finalScore = baseScore + windEffect;
  if (isBestSwell) finalScore += 1;

  if (finalScore >= 5) return 'excellent';
  if (finalScore >= 4) return 'good';
  if (finalScore >= 3) return 'fair';
  return 'poor';
}

// ベストスウェル判定
function checkBestSwell(bestSwell: string | undefined, currentDirStr: string): boolean {
  if (!bestSwell || !currentDirStr || currentDirStr === '-') return false;
  const candidates = bestSwell.toUpperCase().split(/[\s,、・]+/);
  return candidates.includes(currentDirStr.toUpperCase());
}

export async function GET() {
  try {
    const results = await Promise.all(surfPoints.map(async (point) => {
      // ... (Request A, B fetch logic remains same)
      const [windRes, waveRes] = await Promise.all([
        fetch(windUrl).then(res => res.json()),
        fetch(waveUrl).then(res => res.json())
      ]);

      if (windRes.error || waveRes.error) {
        console.error(`Error fetching data for ${point.name}`, windRes, waveRes);
        return null;
      }

      // --- Data Coalescing (Existing logic) ---
      let curWave = waveRes.current.wave_height;
      if (curWave === null && waveRes.hourly.wave_height_gwam) curWave = waveRes.hourly.wave_height_gwam[0];
      let curWaveDir = waveRes.current.wave_direction;
      if (curWaveDir === null && waveRes.hourly.wave_direction_gwam) curWaveDir = waveRes.hourly.wave_direction_gwam[0];
      let curWindSpd = windRes.current.wind_speed_10m; // km/h
      let curWindDir = windRes.current.wind_direction_10m;
      let curTemp = windRes.current.temperature_2m;
      const curVisibility = windRes.current.visibility; 
      const curCloudCover = windRes.current.cloud_cover; 

      const windSpeedMs = curWindSpd !== null ? curWindSpd / 3.6 : 0;
      const windDirStr = degreesToDir(curWindDir);
      const waveDirStr = degreesToDir(curWaveDir);
      
      // --- New Assessment Logic ---
      // 外洋のうねりから、ビーチに届く有効な波高を計算
      const effectiveHeight = calculateEffectiveHeight(curWave, waveDirStr, point.beachFacing);
      const waveBase = getWaveBaseScore(effectiveHeight);
      
      const isBestSwell = checkBestSwell(point.bestSwell, waveDirStr);
      const windEffect = getWindEffect(point.beachFacing, windDirStr, windSpeedMs);
      
      const finalQuality = calculateQuality(waveBase.score, windEffect, isBestSwell);

      // Hourly Data refinement
      const hWaveHeight = waveRes.hourly.wave_height_best_match || waveRes.hourly.wave_height_gwam;
      const hWavePeriod = waveRes.hourly.wave_period_best_match || waveRes.hourly.wave_period_gwam;
      const hWaveDir = waveRes.hourly.wave_direction_best_match || waveRes.hourly.wave_direction_gwam;
      const hWindSpeed = windRes.hourly.wind_speed_10m_jma_msm || windRes.hourly.wind_speed_10m_gfs_seamless;
      const hWindDir = windRes.hourly.wind_direction_10m_jma_msm || windRes.hourly.wind_direction_10m_gfs_seamless;
      
      const hourlyData = waveRes.hourly.time.slice(0, 24).map((time: string, i: number) => {
          const hSwellHeight = hWaveHeight[i];
          const hWDirStr = degreesToDir(hWaveDir[i]);
          
          // 各時間帯でも有効波高を計算
          const hEffectiveHeight = calculateEffectiveHeight(hSwellHeight, hWDirStr, point.beachFacing);
          const hWBase = getWaveBaseScore(hEffectiveHeight);
          
          const hWindDirStr = degreesToDir(hWindDir[i]);
          const hWindSpdMs = hWindSpeed[i] ? hWindSpeed[i] / 3.6 : 0;
          
          const hIsBestSwell = checkBestSwell(point.bestSwell, hWDirStr);
          const hWindEffect = getWindEffect(point.beachFacing, hWindDirStr, hWindSpdMs);
          const hQuality = calculateQuality(hWBase.score, hWindEffect, hIsBestSwell);

          return {
              time: time,
              waveHeight: hEffectiveHeight, // 予測された有効波高をセット
              waveLabel: hWBase.label,
              waveRange: hWBase.range,
              period: hWavePeriod[i],
              windSpeed: hWindSpdMs,
              windDir: hWindDirStr,
              quality: hQuality
          };
      });
      
      return {
        id: point.id,
        beach: point.name,
        height: waveBase.label,
        heightMeters: effectiveHeight, // 修正: 有効波高を返す
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
        hourly: hourlyData
      };
    }));

    const validResults = results.filter(r => r !== null);
    return NextResponse.json(validResults);

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
