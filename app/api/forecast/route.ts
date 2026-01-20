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

// 波高からラベルを取得 (GAS版の移植)
function getWaveLabel(height: number | null) {
  if (height === null) return { label: '-', range: '-', quality: 'fair' as const };
  
  if (height < 0.2) return { label: 'フラット', range: '0.0-0.2m', quality: 'poor' as const };
  if (height < 0.4) return { label: 'スネ〜ヒザ', range: '0.2-0.4m', quality: 'fair' as const };
  if (height < 0.7) return { label: 'ヒザ〜モモ', range: '0.4-0.7m', quality: 'good' as const };
  if (height < 0.9) return { label: 'モモ〜腰', range: '0.7-0.9m', quality: 'excellent' as const };
  if (height < 1.2) return { label: '腰〜腹', range: '0.9-1.2m', quality: 'excellent' as const };
  if (height < 1.5) return { label: '腹〜胸', range: '1.2-1.5m', quality: 'good' as const };
  if (height < 1.9) return { label: '胸〜肩', range: '1.5-1.9m', quality: 'fair' as const };
  if (height < 2.4) return { label: '肩〜頭', range: '1.9-2.4m', quality: 'fair' as const };
  return { label: '頭オーバー', range: '2.4m+', quality: 'fair' as const };
}

// ベストスウェル判定
function checkBestSwell(bestSwell: string | undefined, currentDirStr: string): boolean {
  if (!bestSwell || !currentDirStr || currentDirStr === '-') return false;
  // カンマやスペースで区切られた方角リストを分解 (例: "NE, ENE" -> ["NE", "ENE"])
  const candidates = bestSwell.toUpperCase().split(/[\s,、・]+/);
  return candidates.includes(currentDirStr.toUpperCase());
}

export async function GET() {
  try {
    // 内部データ(lib/surf-points.ts)を使用
    
    const results = await Promise.all(surfPoints.map(async (point) => {
      // Request A: 風 & 気温 & 視程 & 雲量
      const windUrl = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}`
        + `&current=wind_speed_10m,wind_direction_10m,temperature_2m,visibility,cloud_cover`
        + `&hourly=wind_speed_10m,wind_direction_10m,temperature_2m`
        + `&models=jma_msm,gfs_seamless` 
        + `&timezone=Asia%2FTokyo`;
      
      // Request B: 波
      const waveUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${point.lat}&longitude=${point.lon}`
        + `&current=wave_height,wave_direction,wave_period`
        + `&hourly=wave_height,wave_direction,wave_period`
        + `&models=best_match,gwam`
        + `&timezone=Asia%2FTokyo`;

      const [windRes, waveRes] = await Promise.all([
        fetch(windUrl).then(res => res.json()),
        fetch(waveUrl).then(res => res.json())
      ]);

      if (windRes.error || waveRes.error) {
        console.error(`Error fetching data for ${point.name}`, windRes, waveRes);
        return null;
      }

      // --- Hybrid Logic (GASと同様のデータ優先順位) ---
      // 現在値
      let curWave = waveRes.current.wave_height;
      if (curWave === null && waveRes.hourly.wave_height_gwam) curWave = waveRes.hourly.wave_height_gwam[0];
      
      let curWavePeriod = waveRes.current.wave_period;
      if (curWavePeriod === null && waveRes.hourly.wave_period_gwam) curWavePeriod = waveRes.hourly.wave_period_gwam[0];

      let curWaveDir = waveRes.current.wave_direction;
      if (curWaveDir === null && waveRes.hourly.wave_direction_gwam) curWaveDir = waveRes.hourly.wave_direction_gwam[0];
      
      let curWindSpd = windRes.current.wind_speed_10m; // km/h
      if (curWindSpd === null && windRes.hourly.wind_speed_10m_gfs_seamless) curWindSpd = windRes.hourly.wind_speed_10m_gfs_seamless[0];
      
      let curWindDir = windRes.current.wind_direction_10m;
      if (curWindDir === null && windRes.hourly.wind_direction_10m_gfs_seamless) curWindDir = windRes.hourly.wind_direction_10m_gfs_seamless[0];

      let curTemp = windRes.current.temperature_2m;
      if (curTemp === null && windRes.hourly.temperature_2m) curTemp = windRes.hourly.temperature_2m[0];

      // 視程と雲量
      const curVisibility = windRes.current.visibility; // m
      const curCloudCover = windRes.current.cloud_cover; // %

      // km/h -> m/s 変換
      const windSpeedMs = curWindSpd !== null ? curWindSpd / 3.6 : 0;
      
      // ラベル生成
      const waveInfo = getWaveLabel(curWave);
      const windDirStr = degreesToDir(curWindDir);
      const waveDirStr = degreesToDir(curWaveDir); // 波の向き(文字列)
      
      // ベストスウェル判定
      const isBestSwell = checkBestSwell(point.bestSwell, waveDirStr);

      // Hourly (直近24時間分くらいを抽出して整形)
      // GAS版同様、配列を合成
      const hWaveHeight = waveRes.hourly.wave_height_best_match || waveRes.hourly.wave_height_gwam;
      const hWavePeriod = waveRes.hourly.wave_period_best_match || waveRes.hourly.wave_period_gwam;
      const hWaveDir = waveRes.hourly.wave_direction_best_match || waveRes.hourly.wave_direction_gwam;
      const hWindSpeed = windRes.hourly.wind_speed_10m_jma_msm || windRes.hourly.wind_speed_10m_gfs_seamless;
      const hWindDir = windRes.hourly.wind_direction_10m_jma_msm || windRes.hourly.wind_direction_10m_gfs_seamless;
      
      const hourlyData = waveRes.hourly.time.slice(0, 24).map((time: string, i: number) => {
          const hWave = hWaveHeight[i];
          const hInfo = getWaveLabel(hWave);
          return {
              time: time,
              waveHeight: hWave,
              waveLabel: hInfo.label,
              waveRange: hInfo.range,
              period: hWavePeriod[i],
              windSpeed: hWindSpeed[i] ? hWindSpeed[i] / 3.6 : 0,
              windDir: degreesToDir(hWindDir[i]),
              quality: hInfo.quality
          };
      });
      
      return {
        id: point.id,
        beach: point.name,
        height: waveInfo.label, // "腰〜腹" など
        heightMeters: curWave,  // 数値も持っておくと便利
        heightRange: waveInfo.range,
        period: curWavePeriod || 0,
        windSpeed: windSpeedMs,
        windDirection: windDirStr,
        waveDirectionStr: waveDirStr, // 追加: 波の向き
        waveDirectionDeg: curWaveDir, // 追加: 波の向き(角度)
        isBestSwell: isBestSwell,     // 追加: ベストスウェルかどうか
        beachFacing: point.beachFacing, // 追加: ビーチの向き
        temperature: curTemp || 0,    // 修正: 実際の気温
        visibility: curVisibility,    // 追加: 視程(m)
        cloudCover: curCloudCover,    // 追加: 雲量(%)
        quality: waveInfo.quality,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        nextUpdate: '1時間後',
        note: point.note,
        bestSwell: point.bestSwell,
        
        // 詳細データ（チャート用など）
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
