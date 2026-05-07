import type { BoardType, QualityLevel } from './types';
import type { BayGeometry } from './surf-points';

// 16方位の定数
export const DIRS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'] as const;
export type Dir = typeof DIRS[number];

// 方位角を16方位の文字列に変換
export function degreesToDir(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined) return '-';
  const dirIndex = Math.round(((degrees % 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
  return DIRS[dirIndex];
}

// 短周期風波は同じ波高でも実感サイズが小さいため補正係数を返す
function periodHeightFactor(period: number | null | undefined): number {
  if (period === null || period === undefined || period <= 0) return 1.0;
  if (period <= 6) return 0.70;
  if (period <= 8) return 0.85;
  return 1.0;
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

  return swellHeight * attenuation * periodHeightFactor(period);
}

/**
 * 湾地形を考慮した有効波高を計算
 *
 * calculateEffectiveHeight の代替として動作する（重ね掛けではない）。
 * 湾の形状を踏まえて、cos減衰モデルでは表現できない以下を反映する:
 * 1. 湾口正対: スウェルが湾口の中心から来ている場合は減衰が小さい（収束係数あり）
 * 2. 湾口端: 湾口の縁に近づくと cos に近い減衰
 * 3. 湾口外: 岬を回折で回り込む波だけが届く（diffractionFactor が下限）
 * 4. 周期による屈折補正: 長周期は斜め入射でも届きやすい
 */
export function calculateBayEffectiveHeight(
  swellHeight: number | null | undefined,
  swellDir: string,
  beachFacing: string,
  period: number | null | undefined,
  bayGeometry: BayGeometry
): number {
  if (swellHeight === null || swellHeight === undefined) return 0;
  if (!swellDir || swellDir === '-') return swellHeight;

  // 開けたビーチ(open type)、または岬の少ない広い semi-enclosed は
  // 湾形状の影響が小さく、湾モデルは陸側スウェルを過大評価しがちなので
  // 標準のcos減衰にフォールバックする
  const hasSignificantHeadlands = bayGeometry.headlands.length > 0
    && bayGeometry.headlands.some((h) => h.distanceKm < 6);
  if (bayGeometry.type === 'open' || (bayGeometry.openingAngle >= 180 && !hasSignificantHeadlands)) {
    return calculateEffectiveHeight(swellHeight, swellDir, beachFacing, period);
  }

  const swellIdx = DIRS.indexOf(swellDir as Dir);
  if (swellIdx === -1) {
    return calculateEffectiveHeight(swellHeight, swellDir, beachFacing, period);
  }

  const swellDeg = swellIdx * 22.5;

  // 湾口からの角度差を計算
  let angleDiff = Math.abs(swellDeg - bayGeometry.openingDir);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;

  // 周期による実効角度の補正（calculateEffectiveHeight と同じロジック）
  if (period !== null && period !== undefined && period > 0) {
    if (period >= 14) angleDiff *= 0.70;
    else if (period >= 12) angleDiff *= 0.85;
    else if (period <= 6) angleDiff *= 1.15;
    else if (period <= 8) angleDiff *= 1.05;
    angleDiff = Math.min(angleDiff, 180);
  }

  const halfOpening = bayGeometry.openingAngle / 2;

  let attenuation: number;

  if (angleDiff <= halfOpening) {
    // スウェルが湾口内から来ている
    // 湾口中心では convergenceFactor、端に行くほど cos 減衰へ滑らかに遷移
    const normalized = halfOpening > 0 ? angleDiff / halfOpening : 0;
    const inOpeningAttenuation = Math.cos((angleDiff * Math.PI) / 180);
    attenuation = bayGeometry.convergenceFactor * (1 - normalized) + inOpeningAttenuation * normalized;
  } else {
    // スウェルが湾口の外から来ている → 岬の回折で一部届く
    // 湾口端からの角度差で cos 減衰し、さらに diffractionFactor で減衰
    // （岬の影に回り込める波の割合が diffractionFactor）
    const excessAngle = angleDiff - halfOpening;
    const cosDecay = Math.max(0, Math.cos((excessAngle * Math.PI) / 180));
    attenuation = bayGeometry.diffractionFactor * cosDecay;
  }

  // 沖の島・岩礁による遮蔽効果
  // スウェル方向と障害物方位が近く、距離が近い場合に部分的にブロック
  if (bayGeometry.obstacles && bayGeometry.obstacles.length > 0) {
    const obstacleAttenuation = calculateObstacleShadow(swellDeg, bayGeometry.obstacles);
    attenuation *= obstacleAttenuation;
  }

  return swellHeight * Math.max(0.05, attenuation) * periodHeightFactor(period);
}

/**
 * 沖の島・岩礁による波の遮蔽効果を計算
 *
 * - スウェルの来る方向に島がある場合、波の影が伸びてビーチに届きにくくなる
 * - 距離が近いほど影は鋭く狭い、距離が遠いほど影は広がるが弱まる
 * - 影の角度幅は経験的に島の規模と距離から推定
 */
function calculateObstacleShadow(
  swellDeg: number,
  obstacles: NonNullable<BayGeometry['obstacles']>
): number {
  let totalShadow = 1.0;

  for (const obs of obstacles) {
    // 島種別の影響強度（島>小島>岩礁）
    const blockStrength =
      obs.type === 'island' ? 0.6 :
      obs.type === 'islet' ? 0.3 :
      0.15; // reef

    // 影の角度幅: 至近距離は鋭く、遠距離は広いが弱まる
    // 0.5km → 約30°、2km → 約15°、5km → 約8°
    const shadowAngle = Math.max(8, 30 - obs.distanceKm * 5);

    // 距離による減衰（遠いほど影響弱い）
    const distanceFactor = Math.max(0, 1 - obs.distanceKm / 5);

    // スウェル方向と島方位の差
    let angleDiff = Math.abs(swellDeg - obs.bearing);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    if (angleDiff < shadowAngle) {
      // 影の中心に近いほど強くブロック
      const proximity = 1 - angleDiff / shadowAngle;
      const shadow = blockStrength * distanceFactor * proximity;
      totalShadow *= 1 - shadow;
    }
  }

  return totalShadow;
}

// 波高からベースのスコアとラベルを取得（ボード種別でピークサイズが変わる）
export function getWaveBaseScore(height: number | null | undefined, boardType: BoardType = 'short') {
  if (height === null || height === undefined) return { score: 1, label: '-', range: '-' };

  if (boardType === 'long') {
    // ロング: ベストゾーンは ヒザ〜腰 (0.5〜0.8m)、頭オーバーは厳しい
    if (height < 0.2) return { score: 1, label: 'フラット', range: '0.0-0.2m' };
    if (height < 0.5) return { score: 3, label: 'スネ〜ヒザ', range: '0.2-0.5m' };
    if (height < 0.8) return { score: 5, label: 'ヒザ〜腰', range: '0.5-0.8m' };
    if (height < 1.2) return { score: 5, label: '腰〜腹', range: '0.8-1.2m' };
    if (height < 1.6) return { score: 4, label: '腹〜胸', range: '1.2-1.6m' };
    if (height < 2.0) return { score: 3, label: '胸〜肩', range: '1.6-2.0m' };
    if (height < 2.5) return { score: 2, label: '肩〜頭', range: '2.0-2.5m' };
    return { score: 1, label: '頭オーバー', range: '2.5m+' };
  }

  // ショート: ベストゾーンは 腹〜胸 (1.2〜1.6m)
  if (height < 0.2) return { score: 1, label: 'フラット', range: '0.0-0.2m' };
  if (height < 0.5) return { score: 2, label: 'スネ〜ヒザ', range: '0.2-0.5m' };
  if (height < 0.8) return { score: 3, label: 'ヒザ〜腰', range: '0.5-0.8m' };
  if (height < 1.2) return { score: 4, label: '腰〜腹', range: '0.8-1.2m' };
  if (height < 1.6) return { score: 5, label: '腹〜胸', range: '1.2-1.6m' };
  if (height < 2.0) return { score: 4, label: '胸〜肩', range: '1.6-2.0m' };
  if (height < 2.5) return { score: 3, label: '肩〜頭', range: '2.0-2.5m' };
  return { score: 2, label: '頭オーバー', range: '2.5m+' };
}

// ボード種別ごとのグレード上限
function getHeightCap(height: number, boardType: BoardType): QualityLevel {
  if (boardType === 'long') {
    if (height < 0.3) return 'C';
    if (height < 0.5) return 'B';
    if (height < 0.8) return 'A';
    return 'S';
  }
  // short
  if (height < 0.3) return 'C';
  if (height < 0.5) return 'C';
  if (height < 0.8) return 'B';
  if (height < 1.0) return 'A';
  return 'S';
}

const QUALITY_RANK: Record<QualityLevel, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };

function applyCap(grade: QualityLevel, cap: QualityLevel): QualityLevel {
  return QUALITY_RANK[grade] > QUALITY_RANK[cap] ? cap : grade;
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
  period: number,
  isSwellDominant?: boolean,  // スウェル成分が風波より支配的か
  tideScoreEffect?: number,   // 潮汐フェーズによる補正スコア
  boardType: BoardType = 'short'
): QualityLevel {
  // フラットは方向・風に関わらず問答無用でD
  if (effectiveHeight < 0.2) return 'D';

  let finalScore = baseScore + windEffect;

  // 波の質ペナルティ: ボード種別で短周期の閾値が異なる
  // ロングは弱い波でも乗れるので閾値が緩い
  const shortPeriodThreshold = boardType === 'long' ? 5 : 6;
  const isShortPeriod = period > 0 && period <= shortPeriodThreshold;
  if (isShortPeriod || isSwellDominant === false) finalScore -= 1;

  // 潮汐フェーズ補正（プラス・マイナスとも反映）
  if (tideScoreEffect !== undefined) finalScore += tideScoreEffect;

  // BESTボーナス
  if (isBestSwell && baseScore >= 2) finalScore += 1;

  let grade: QualityLevel;
  if (finalScore >= 5) grade = 'S';
  else if (finalScore >= 4) grade = 'A';
  else if (finalScore >= 3) grade = 'B';
  else if (finalScore >= 2) grade = 'C';
  else grade = 'D';

  // 波サイズによる上限キャップ（ボード種別で変動）
  return applyCap(grade, getHeightCap(effectiveHeight, boardType));
}

/**
 * スウェル成分と風波成分を分離して解析する
 * - 有効スウェル高 / 有効風波高を個別計算
 * - 波エネルギー合成: combined = √(swell² + windWave²)
 * - ドミナント成分（周期・方向）を返す
 */
export function analyzeSwellComponents(params: {
  swellHeight: number | null;
  swellDir: number | null;
  swellPeriod: number | null;
  windWaveHeight: number | null;
  windWaveDir: number | null;
  windWavePeriod: number | null;
  beachFacing: string;
  bayGeometry?: BayGeometry;
}): {
  effectiveSwellHeight: number;
  effectiveWindWaveHeight: number;
  combinedEffectiveHeight: number;
  dominantPeriod: number;
  dominantDirStr: string;
  isSwellDominant: boolean;
} {
  const { swellHeight, swellDir, swellPeriod, windWaveHeight, windWaveDir, windWavePeriod, beachFacing, bayGeometry } = params;

  const swellDirStr = degreesToDir(swellDir);
  const windWaveDirStr = degreesToDir(windWaveDir);

  const effSwell = bayGeometry
    ? calculateBayEffectiveHeight(swellHeight, swellDirStr, beachFacing, swellPeriod, bayGeometry)
    : calculateEffectiveHeight(swellHeight, swellDirStr, beachFacing, swellPeriod);
  const effWindWave = bayGeometry
    ? calculateBayEffectiveHeight(windWaveHeight, windWaveDirStr, beachFacing, windWavePeriod, bayGeometry)
    : calculateEffectiveHeight(windWaveHeight, windWaveDirStr, beachFacing, windWavePeriod);

  // 波エネルギーの合成（二乗和の平方根）
  const combined = Math.sqrt(effSwell ** 2 + effWindWave ** 2);

  const isSwellDominant = effSwell >= effWindWave;

  return {
    effectiveSwellHeight: effSwell,
    effectiveWindWaveHeight: effWindWave,
    combinedEffectiveHeight: Math.round(combined * 100) / 100,
    dominantPeriod: isSwellDominant ? (swellPeriod ?? 0) : (windWavePeriod ?? 0),
    dominantDirStr: isSwellDominant ? swellDirStr : windWaveDirStr,
    isSwellDominant,
  };
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
