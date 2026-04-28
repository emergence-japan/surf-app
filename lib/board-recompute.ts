import type { BoardType, SurfPointDetail, HourlyForecastData } from './types';
import { getWaveBaseScore, calculateQuality, getWindEffect, DIRS, type Dir } from './wave-calculations';

// 風向き文字列(N/NE/...)とビーチの向きから dirDiff (0=オン、8=オフ) を出す
function dirDiff(beachFacing: string, windDirStr: string): number {
  const a = DIRS.indexOf(beachFacing as Dir);
  const b = DIRS.indexOf(windDirStr as Dir);
  if (a === -1 || b === -1) return -1;
  let d = Math.abs(a - b);
  if (d > 8) d = 16 - d;
  return d;
}

// hourlyから timeにマッチする tideScoreEffect を取り出すのは
// API側の責務なので再計算では tideScoreEffect は無視（ベース指標が既にAPIで反映済み）。
// ボード切替で再計算するのは「波サイズと周期と風」起因の差分のみ。

interface RecomputeContext {
  beachFacing: string;
  isBestSwell: boolean;
}

export function recomputeQualityForBoard(
  effectiveHeight: number,
  windDirStr: string,
  windSpeed: number,
  period: number,
  isSwellDominant: boolean | undefined,
  ctx: RecomputeContext,
  boardType: BoardType
) {
  const base = getWaveBaseScore(effectiveHeight, boardType);
  const windEffect = getWindEffect(ctx.beachFacing, windDirStr, windSpeed);
  const quality = calculateQuality(
    base.score,
    windEffect,
    ctx.isBestSwell,
    effectiveHeight,
    period,
    isSwellDominant,
    undefined, // tideは前提から無視
    boardType
  );
  return { quality, label: base.label, range: base.range };
}

// 詳細データ全体をボード切替後の値で書き換える
export function applyBoardType(point: SurfPointDetail, boardType: BoardType): SurfPointDetail {
  const ctx = { beachFacing: point.beachFacing, isBestSwell: point.isBestSwell };
  const cur = recomputeQualityForBoard(
    point.heightMeters,
    point.windDirection,
    point.windSpeed ?? 0,
    point.period ?? 0,
    point.isSwellDominant,
    ctx,
    boardType
  );

  const hourly: HourlyForecastData[] = point.hourly.map(h => {
    const r = recomputeQualityForBoard(
      h.waveHeight,
      h.windDir,
      h.windSpeed,
      h.period,
      h.isSwellDominant,
      ctx,
      boardType
    );
    return { ...h, quality: r.quality, waveLabel: r.label, waveRange: r.range };
  });

  return {
    ...point,
    quality: cur.quality,
    height: cur.label,
    heightRange: cur.range,
    hourly,
  };
}
