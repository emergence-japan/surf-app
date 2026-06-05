import { describe, it, expect } from 'vitest';
import {
  degreesToDir,
  calculateEffectiveHeight,
  applyBreakProfileHeightFactor,
  getWaveBaseScore,
  getWindEffect,
  calculateQuality,
  explainQuality,
  summarizeQualityFactors,
  checkBestSwell,
  DIRS,
} from '@/lib/wave-calculations';
import type { BreakProfile } from '@/lib/surf-points';
import type { QualityFactor } from '@/lib/types';

describe('degreesToDir', () => {
  it('北（0°）を N に変換する', () => {
    expect(degreesToDir(0)).toBe('N');
    expect(degreesToDir(360)).toBe('N');
  });

  it('東（90°）を E に変換する', () => {
    expect(degreesToDir(90)).toBe('E');
  });

  it('南（180°）を S に変換する', () => {
    expect(degreesToDir(180)).toBe('S');
  });

  it('西（270°）を W に変換する', () => {
    expect(degreesToDir(270)).toBe('W');
  });

  it('null/undefined は "-" を返す', () => {
    expect(degreesToDir(null)).toBe('-');
    expect(degreesToDir(undefined)).toBe('-');
  });

  it('負の角度を正しく処理する', () => {
    expect(degreesToDir(-90)).toBe('W');
  });

  it('結果は必ず DIRS に含まれる値か "-" である', () => {
    [0, 22.5, 45, 90, 135, 180, 225, 270, 315].forEach(deg => {
      const result = degreesToDir(deg);
      expect([...DIRS, '-']).toContain(result);
    });
  });
});

describe('calculateEffectiveHeight', () => {
  it('null の波高は 0 を返す', () => {
    expect(calculateEffectiveHeight(null, 'N', 'N')).toBe(0);
    expect(calculateEffectiveHeight(undefined, 'N', 'N')).toBe(0);
  });

  it('正面から来る波（diff=0）は減衰なし', () => {
    // ビーチが N 向き、うねりが N から来る → 完全に正面
    const result = calculateEffectiveHeight(1.0, 'N', 'N');
    expect(result).toBeCloseTo(1.0, 2);
  });

  it('真横（90°差、diff=4）は大きく減衰する', () => {
    // ビーチが N 向き、うねりが E から来る（90°差）
    const result = calculateEffectiveHeight(1.0, 'E', 'N');
    expect(result).toBeLessThan(0.1);
  });

  it('45°差（diff=2）は約 70% 程度に減衰', () => {
    // ビーチが N 向き、うねりが NE から来る（45°差）
    const result = calculateEffectiveHeight(1.0, 'NE', 'N');
    expect(result).toBeGreaterThan(0.6);
    expect(result).toBeLessThan(0.8);
  });

  it('背後から来る波（diff=8、180°）は最小減衰（0.05）を下回らない', () => {
    // ビーチが N 向き、うねりが S から来る（真後ろ）
    const result = calculateEffectiveHeight(1.0, 'S', 'N');
    expect(result).toBeGreaterThanOrEqual(0.05);
  });

  it('長周期（14s+）は角度減衰が緩和される', () => {
    // 同じ 45° 差でも長周期の方が波高が高くなる
    const shortPeriod = calculateEffectiveHeight(1.0, 'NE', 'N', 5);
    const longPeriod = calculateEffectiveHeight(1.0, 'NE', 'N', 15);
    expect(longPeriod).toBeGreaterThan(shortPeriod);
  });

  it('方向情報がない場合は生の波高をそのまま返す', () => {
    expect(calculateEffectiveHeight(1.5, '-', 'N')).toBe(1.5);
    expect(calculateEffectiveHeight(1.5, '', 'N')).toBe(1.5);
  });
});

describe('applyBreakProfileHeightFactor', () => {
  it('短周期の湾内・河口ポイントでは体感サイズ用の有効波高を下げる', () => {
    const adjusted = applyBreakProfileHeightFactor(0.84, 5.5, {
      bottom: 'river_mouth',
      exposure: 'sheltered_bay',
      dumperRisk: 'medium',
      mellowBias: 'low',
      idealPeriodMin: 8,
      shortPeriodHeightFactor: 0.45,
    });

    expect(adjusted).toBeCloseTo(0.38, 2);
    expect(getWaveBaseScore(adjusted).label).toBe('スネ〜ヒザ');
  });

  it('長周期または補正なしのポイントでは波高を変えない', () => {
    expect(applyBreakProfileHeightFactor(0.84, 8, undefined)).toBe(0.84);
    expect(applyBreakProfileHeightFactor(0.84, 9, {
      bottom: 'river_mouth',
      exposure: 'sheltered_bay',
      dumperRisk: 'medium',
      mellowBias: 'low',
      idealPeriodMin: 8,
      shortPeriodHeightFactor: 0.45,
    })).toBe(0.84);
  });
});

describe('getWaveBaseScore', () => {
  it('フラット（0.1m）は score=1', () => {
    const result = getWaveBaseScore(0.1);
    expect(result.score).toBe(1);
    expect(result.label).toBe('フラット');
  });

  it('腹〜胸（1.4m）は最高スコア score=5', () => {
    const result = getWaveBaseScore(1.4);
    expect(result.score).toBe(5);
    expect(result.label).toBe('腹〜胸');
  });

  it('頭オーバー（3.0m）は score=2', () => {
    const result = getWaveBaseScore(3.0);
    expect(result.score).toBe(2);
    expect(result.label).toBe('頭オーバー');
  });

  it('null/undefined は score=1 を返す', () => {
    expect(getWaveBaseScore(null).score).toBe(1);
    expect(getWaveBaseScore(undefined).score).toBe(1);
  });

  it('範囲文字列を含む', () => {
    const result = getWaveBaseScore(1.0);
    expect(result.range).toMatch(/m/);
  });
});

describe('getWindEffect', () => {
  it('弱いオフショア（diff=8）は +1', () => {
    // ビーチが N 向き、風が S から来る（真オフショア）
    expect(getWindEffect('N', 'S', 3)).toBe(1);
  });

  it('強いオンショア（8m/s超）は -3', () => {
    // ビーチが N 向き、風が N から来る（真オンショア）、強風
    expect(getWindEffect('N', 'N', 10)).toBe(-3);
  });

  it('弱いオンショア（3m/s超〜5m/s以下）は -1', () => {
    expect(getWindEffect('N', 'N', 4)).toBe(-1);
  });

  it('無風に近い弱いオンショアは 0', () => {
    expect(getWindEffect('N', 'N', 2)).toBe(0);
  });

  it('強いサイドショア（5m/s超）は -1', () => {
    // ビーチが N 向き、風が E から来る（サイド）
    expect(getWindEffect('N', 'E', 6)).toBe(-1);
  });

  it('方向情報がない場合は 0', () => {
    expect(getWindEffect('N', '-', 5)).toBe(0);
    expect(getWindEffect('', 'N', 5)).toBe(0);
  });
});

describe('calculateQuality', () => {
  it('フラット（0.1m）は常に D', () => {
    expect(calculateQuality(5, 1, true, 0.1, 12)).toBe('D');
    expect(calculateQuality(1, 0, false, 0.0, 0)).toBe('D');
  });

  it('高スコア + オフショア + ベストうねり → S', () => {
    // baseScore=5（腹〜胸）+ windEffect=1（オフショア）+ bestSwell +1 = 7 → S
    expect(calculateQuality(5, 1, true, 1.4, 12)).toBe('S');
  });

  it('短周期風波（6s以下）はペナルティ -1', () => {
    // baseScore=4 + windEffect=0 - period penalty 1 = 3 → B
    const withPenalty = calculateQuality(4, 0, false, 1.0, 5);
    // baseScore=4 + windEffect=0 = 4 → A
    const withoutPenalty = calculateQuality(4, 0, false, 1.0, 10);
    expect(withPenalty).toBe('B');
    expect(withoutPenalty).toBe('A');
  });

  it('スポット別の短周期ペナルティでダンパーになりやすい波を下げる', () => {
    const withoutProfile = calculateQuality(4, 0, false, 1.0, 7);
    const withProfile = calculateQuality(4, 0, false, 1.0, 7, true, 0, 'short', {
      bottom: 'shallow_sand',
      exposure: 'sheltered_bay',
      dumperRisk: 'high',
      mellowBias: 'low',
      idealPeriodMin: 8,
      shortPeriodPenalty: 1,
      windWavePenalty: 1,
    });

    expect(withoutProfile).toBe('A');
    expect(withProfile).toBe('B');
  });

  it('D < C < B < A < S のスコア順序', () => {
    const order = ['D', 'C', 'B', 'A', 'S'];
    const results = [
      calculateQuality(1, 0, false, 0.5, 10), // score=1 → C
      calculateQuality(2, 0, false, 0.5, 10), // score=2 → C
      calculateQuality(3, 0, false, 0.5, 10), // score=3 → B
      calculateQuality(4, 0, false, 1.0, 10), // score=4 → A
      calculateQuality(5, 0, false, 1.4, 10), // score=5 → S（5>=5）
    ];
    results.forEach(r => {
      expect(order).toContain(r);
    });
  });
});

describe('checkBestSwell', () => {
  it('ベストうねり方向と一致する場合 true', () => {
    expect(checkBestSwell('NE, NNE, N', 'N', 10)).toBe(true);
    expect(checkBestSwell('NE, NNE, N', 'NE', 10)).toBe(true);
  });

  it('ベストうねり方向と一致しない場合 false', () => {
    expect(checkBestSwell('NE, NNE, N', 'S', 10)).toBe(false);
    expect(checkBestSwell('NE, NNE, N', 'SW', 10)).toBe(false);
  });

  it('周期が 8 秒未満の場合は false（風波はベストうねりとみなさない）', () => {
    expect(checkBestSwell('N', 'N', 5)).toBe(false);
    expect(checkBestSwell('N', 'N', 7)).toBe(false);
    expect(checkBestSwell('N', 'N', 8)).toBe(true);
  });

  it('bestSwell が undefined の場合は false', () => {
    expect(checkBestSwell(undefined, 'N', 10)).toBe(false);
  });

  it('currentDirStr が "-" の場合は false', () => {
    expect(checkBestSwell('N', '-', 10)).toBe(false);
  });

  it('大文字小文字を区別しない', () => {
    expect(checkBestSwell('ne, nne, n', 'N', 10)).toBe(true);
  });

  it('様々な区切り文字に対応する', () => {
    expect(checkBestSwell('NE NNE N', 'NNE', 10)).toBe(true);
    expect(checkBestSwell('NE・NNE・N', 'N', 10)).toBe(true);
    expect(checkBestSwell('NE、NNE、N', 'NE', 10)).toBe(true);
  });
});

describe('explainQuality', () => {
  // 「波あるのに評価が悪い」を説明するための内訳生成
  const river: BreakProfile = {
    bottom: 'river_mouth',
    exposure: 'sheltered_bay',
    dumperRisk: 'medium',
    mellowBias: 'low',
    idealPeriodMin: 8,
    shortPeriodPenalty: 1,
    windWavePenalty: 1,
  };

  it('フラットは「ほぼフラット」要因のみ返す', () => {
    const factors = explainQuality(1, 0, false, 0.1, 0);
    expect(factors).toEqual([{ label: 'ほぼフラット', delta: 0 }]);
  });

  it('腹サイズ・好条件ではベース要因だけのプラス内訳になる', () => {
    // 腹〜胸(1.4m)=baseScore5, オフショア(+1), 長周期, ベスト
    const factors = explainQuality(5, 1, true, 1.4, 12, true, 0, 'short');
    // ベース + オフショア + ベスト の3要因
    expect(factors.find(f => f.delta < 0)).toBeUndefined();
    expect(factors.some(f => f.label.includes('オフショア'))).toBe(true);
    expect(factors.some(f => f.label === 'ベストうねり')).toBe(true);
  });

  it('腹サイズでも短周期・満潮でマイナス要因が並ぶ', () => {
    // 腰〜腹(1.0m)=baseScore4, 短周期5秒, 満潮-1
    const factors = explainQuality(4, 0, false, 1.0, 5, false, -1, 'short', undefined, '満潮');
    const labels = factors.map(f => f.label);
    expect(labels.some(l => l.includes('腰〜腹'))).toBe(true);
    expect(labels.some(l => l.includes('短周期'))).toBe(true);
    expect(labels.some(l => l.includes('満潮'))).toBe(true);
    // マイナス要因が存在する
    expect(factors.some(f => f.delta < 0)).toBe(true);
  });

  it('河口プロファイルで短周期・風波ペナルティが要因に出る', () => {
    // 周期6秒 < idealPeriodMin8, 風波支配
    const factors = explainQuality(4, 0, false, 1.0, 6, false, 0, 'short', river);
    const labels = factors.map(f => f.label);
    expect(labels.some(l => l.includes('周期が短い'))).toBe(true);
    expect(labels.some(l => l.includes('風波'))).toBe(true);
  });

  it('要因の delta 合計が calculateQuality のグレードと整合する', () => {
    // キャップに掛からない波高（>=1.0m → 上限S）で、スコア合計→グレードが一致することを確認
    const cases: Array<Parameters<typeof explainQuality>> = [
      [5, 1, true, 1.4, 12, true, 0, 'short'],            // 高条件
      [4, 0, false, 1.0, 5, false, -1, 'short'],          // 腹だが短周期+満潮
      [4, -2, false, 1.2, 9, true, 0, 'short'],           // 腹だがオンショア
      [5, -3, false, 1.5, 10, true, -1, 'short'],         // 腹胸だが強風+満潮
    ];

    for (const args of cases) {
      const factors = explainQuality(...args);
      const sum = factors.reduce((acc, f) => acc + f.delta, 0);
      // calculateQuality は最大9引数（explainQuality 末尾の tidePhaseLabel は表示専用）
      const grade = calculateQuality(
        ...(args.slice(0, 9) as Parameters<typeof calculateQuality>)
      );

      // sum からグレードを再計算（キャップ無視。波高>=1.0なので上限Sで影響しない）
      const expected = sum >= 5 ? 'S' : sum >= 4 ? 'A' : sum >= 3 ? 'B' : sum >= 2 ? 'C' : 'D';
      expect(grade).toBe(expected);
    }
  });
});

describe('summarizeQualityFactors', () => {
  it('空なら空文字を返す', () => {
    expect(summarizeQualityFactors([])).toBe('');
  });

  it('フラット単独要因はそのラベルを返す', () => {
    expect(summarizeQualityFactors([{ label: 'ほぼフラット', delta: 0 }])).toBe('ほぼフラット');
  });

  it('減点があると「土台はあるが主犯で下がる」形にする', () => {
    const factors: QualityFactor[] = [
      { label: 'ヒザ〜腰のサイズ', delta: 3 },
      { label: '短周期の風波', delta: -1 },
      { label: '下げ潮（好条件）', delta: 1 },
    ];
    const s = summarizeQualityFactors(factors);
    expect(s).toContain('ヒザ〜腰のサイズ'); // 最大の加点が土台として入る
    expect(s).toContain('短周期の風波');     // 最大の減点が主犯として入る
  });

  it('減点合計が-2以下なら「大きく」を含む', () => {
    const factors: QualityFactor[] = [
      { label: '腰〜腹のサイズ', delta: 4 },
      { label: '短周期の風波', delta: -1 },
      { label: '風波主体', delta: -1 },
    ];
    expect(summarizeQualityFactors(factors)).toContain('大きく');
  });

  it('減点なしなら good 系のポジティブな文にする', () => {
    const factors: QualityFactor[] = [
      { label: '腹〜胸のサイズ', delta: 5 },
      { label: 'オフショア（面が整う）', delta: 1 },
    ];
    const s = summarizeQualityFactors(factors);
    expect(s).toContain('good');
    expect(s).not.toContain('下がって');
  });
});
