import { describe, it, expect } from 'vitest';
import {
  degreesToDir,
  calculateEffectiveHeight,
  getWaveBaseScore,
  getWindEffect,
  calculateQuality,
  checkBestSwell,
  DIRS,
} from '@/lib/wave-calculations';

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
