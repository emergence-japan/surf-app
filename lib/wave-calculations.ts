// 16方位の定数
export const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'] as const;
export type Dir = typeof DIRS[number];

// 方位角を16方位の文字列に変換
export function degreesToDir(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined) return '-';
  const dirIndex = Math.round(((degrees % 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
  return DIRS[dirIndex];
}

// ビーチでの有効な波高を計算
// - cos関数で物理的に正確な角度減衰を計算
// - 周期が長いほど屈折でビーチに届きやすいため実効角度を補正
export function calculateEffectiveHeight(
  swellHeight: number | null | undefined,
  swellDir: string,
  beachFacing: string,
  period?: number | null
): number {
  if (swellHeight === null || swellHeight === undefined) return 0;
  if (!swellDir || !beachFacing || swellDir === '-') return swellHeight;

  const beachIdx = DIRS.indexOf(beachFacing as Dir);
  const swellIdx = DIRS.indexOf(swellDir as Dir);

  if (beachIdx === -1 || swellIdx === -1) return swellHeight;

  let diff = Math.abs(beachIdx - swellIdx);
  if (diff > 8) diff = 16 - diff;

  // 角度差（度数）
  let angleDeg = diff * 22.5;

  // 周期による実効角度の補正
  // 長周期うねりは屈折により斜め方向でもビーチに届きやすい
  if (period !== null && period !== undefined && period > 0) {
    if (period >= 14) {
      angleDeg *= 0.70;
    } else if (period >= 12) {
      angleDeg *= 0.85;
    } else if (period <= 6) {
      angleDeg *= 1.15;
    } else if (period <= 8) {
      angleDeg *= 1.05;
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
export function getWaveBaseScore(height: number | null | undefined) {
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
export function getWindEffect(beachFacing: string, windDir: string, windSpeed: number): number {
  if (!beachFacing || !windDir || windDir === '-') return 0;

  const beachIdx = DIRS.indexOf(beachFacing as Dir);
  const windIdx = DIRS.indexOf(windDir as Dir);

  if (beachIdx === -1 || windIdx === -1) return 0;

  let diff = Math.abs(beachIdx - windIdx);
  if (diff > 8) diff = 16 - diff;

  // 8 m/s 超の強風はどの方向でもサーフィンに向かない
  if (windSpeed > 8) {
    if (diff >= 6) return -1;
    if (diff >= 3) return -2;
    return -3;
  }

  // オフショア（135°〜180°: diff 6〜8）
  if (diff >= 6) return 1;

  // サイドショア（67.5°〜112.5°: diff 3〜5）
  if (diff >= 3) {
    return windSpeed > 5 ? -1 : 0;
  }

  // オンショア（0°〜45°: diff 0〜2）
  if (windSpeed > 5) return -2;
  if (windSpeed > 3) return -1;
  return 0;
}

// 最終的なQualityを決定
export function calculateQuality(
  baseScore: number,
  windEffect: number,
  isBestSwell: boolean,
  effectiveHeight: number,
  period: number
): 'S' | 'A' | 'B' | 'C' | 'D' {
  // フラットは方向・風に関わらず問答無用でD
  if (effectiveHeight < 0.2) return 'D';

  let finalScore = baseScore + windEffect;

  // 周期ペナルティ: 6秒以下の風波はパワーが弱くグレードを下げる
  if (period > 0 && period <= 6) finalScore -= 1;

  // BESTボーナス: 本物のうねり(8秒以上)かつ波がある場合のみ
  if (isBestSwell && period >= 8 && baseScore >= 2) finalScore += 1;

  if (finalScore >= 5) return 'S';
  if (finalScore >= 4) return 'A';
  if (finalScore >= 3) return 'B';
  if (finalScore >= 2) return 'C';
  return 'D';
}

// ベストスウェル判定
export function checkBestSwell(bestSwell: string | undefined, currentDirStr: string, period: number): boolean {
  if (!bestSwell || !currentDirStr || currentDirStr === '-') return false;
  // 周期データなし(0)または8秒未満の風波はベストうねりとみなさない
  if (period < 8) return false;
  const candidates = bestSwell.toUpperCase().split(/[\s,、・]+/);
  return candidates.includes(currentDirStr.toUpperCase());
}

// コンディション解説文をシナリオベースで生成
export function generateConditionSummary(params: {
  waveDirectionStr: string;
  isBestSwell: boolean;
  effectiveHeight: number;
  waveLabel: string;
  period: number;
  windDirStr: string;
  windSpeed: number;
  beachFacing: string;
}): string {
  const { waveDirectionStr, isBestSwell, effectiveHeight, waveLabel,
          period, windDirStr, windSpeed, beachFacing } = params;

  // ---- フラット ----
  if (effectiveHeight < 0.2) {
    return 'ほぼフラットです。今日は波はほとんどありません。';
  }

  // ---- 風向きの判定 ----
  const beachIdx = DIRS.indexOf(beachFacing as Dir);
  const windIdx  = DIRS.indexOf(windDirStr  as Dir);
  let windDiff = -1;
  if (beachIdx !== -1 && windIdx !== -1 && windDirStr !== '-') {
    windDiff = Math.abs(beachIdx - windIdx);
    if (windDiff > 8) windDiff = 16 - windDiff;
  }

  const isOffshore = windDiff >= 6;
  const isSide     = windDiff >= 3 && windDiff < 6;
  const isOnshore  = windDiff >= 0 && windDiff < 3 && windDiff !== -1;

  const isGroundSwell = period >= 8;
  const isTrueBestSwell = isBestSwell && isGroundSwell;

  const dir = waveDirectionStr && waveDirectionStr !== '-' ? waveDirectionStr : '';
  const periodStr = Math.round(period);

  // ---- シナリオ分岐 ----

  // 【強風】どの方向でも8m/s超はNG
  if (windSpeed > 8) {
    const windType = isOffshore ? 'オフショア' : isSide ? 'サイドショア' : 'オンショア';
    return `強い${windType}（${windSpeed.toFixed(1)}m/s）が吹いており、`
      + `${waveLabel}サイズの波はあるものの波面は荒れています。今日は見送りが無難です。`;
  }

  // 【オフショア〜8m/s】
  if (isOffshore) {
    if (isTrueBestSwell) {
      return `${dir}からのベストうねり（周期${periodStr}秒）にオフショアが重なり、`
        + `${waveLabel}の波面がきれいに整っています。絶好のコンディションです！`;
    }
    if (isGroundSwell) {
      return `${dir}からのうねり（周期${periodStr}秒）が届き、`
        + `オフショアで波面が整っています。${waveLabel}で良好なコンディションです。`;
    }
    return `オフショアで面はきれいですが、周期${periodStr}秒の風波気味の波です。`
      + `${waveLabel}サイズですが、パワーはいまひとつです。`;
  }

  // 【オンショア〜8m/s】
  if (isOnshore) {
    if (windSpeed > 5) {
      return `オンショアの風（${windSpeed.toFixed(1)}m/s）で波面が荒れています。`
        + `${waveLabel}の波はありますが、コンディションは厳しい状況です。`;
    }
    if (windSpeed > 3) {
      return `弱いオンショア（${windSpeed.toFixed(1)}m/s）でやや波面が乱れています。`
        + `${dir}から${waveLabel}サイズで、形はまずまずです。`;
    }
    if (isTrueBestSwell) {
      return `${dir}からのベストうねり（周期${periodStr}秒）がほぼ無風の中で届いています。`
        + `${waveLabel}で良好なコンディションです。`;
    }
    return `${dir}からのうねりがほぼ無風の中で届いています。${waveLabel}で波面はきれいです。`;
  }

  // 【サイドショア〜8m/s】
  if (isSide) {
    if (windSpeed > 5) {
      return `サイドからの風（${windSpeed.toFixed(1)}m/s）で波面がやや乱れています。`
        + `${dir}から${waveLabel}サイズですが形はいまひとつです。`;
    }
    if (isTrueBestSwell) {
      return `${dir}からのベストうねり（周期${periodStr}秒）が入っています。`
        + `サイドからの弱い風で${waveLabel}、まずまずのコンディションです。`;
    }
    return `${dir}からのうねりで${waveLabel}サイズです。サイドの弱い風でまずまずのコンディションです。`;
  }

  // 【フォールバック: 風向き不明など】
  return `${dir ? `${dir}から` : ''}${waveLabel}サイズの波が届いています。`;
}
