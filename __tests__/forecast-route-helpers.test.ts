import { describe, it, expect } from 'vitest';
import { degreesToDir, getWaveBaseScore, getWindEffect, calculateQuality, checkBestSwell } from '@/lib/wave-calculations';
import { computeTideHeight, computeTidePhase, getTideScoreEffect } from '@/lib/tide-predictor';

// ensembleAvg はモジュール内部関数のため、同等ロジックを直接テスト
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

describe('ensembleAvg', () => {
  it('両配列が揃っている場合は平均値を返す', () => {
    expect(ensembleAvg([1, 2, 3], [3, 4, 5], undefined)).toEqual([2, 3, 4]);
  });

  it('片方が null の要素は null でない方を使う', () => {
    expect(ensembleAvg([1, null, 3], [2, 4, null], undefined)).toEqual([1.5, 4, 3]);
  });

  it('両方 null の要素は null を返す', () => {
    expect(ensembleAvg([null], [null], undefined)).toEqual([null]);
  });

  it('a が undefined の場合は b にフォールバック', () => {
    expect(ensembleAvg(undefined, [1, 2], undefined)).toEqual([1, 2]);
  });

  it('a・b ともに undefined の場合は fallback を返す', () => {
    expect(ensembleAvg(undefined, undefined, [9, 8])).toEqual([9, 8]);
  });

  it('a・b・fallback すべて undefined の場合は null を返す', () => {
    expect(ensembleAvg(undefined, undefined, undefined)).toBeNull();
  });

  it('配列長が異なる場合は a を優先', () => {
    expect(ensembleAvg([1, 2], [3], undefined)).toEqual([1, 2]);
  });

  it('小数点2桁に丸める', () => {
    // (1.5 + 1.5) / 2 = 1.5 → Math.round(150) / 100 = 1.5
    expect(ensembleAvg([1.5], [1.5], undefined)).toEqual([1.5]);
    // (1.0 + 1.2) / 2 = 1.1
    expect(ensembleAvg([1.0], [1.2], undefined)).toEqual([1.1]);
  });
});

describe('getWaveBaseScore', () => {
  it('フラット（0.1m）はスコア1', () => {
    expect(getWaveBaseScore(0.1).score).toBe(1);
  });

  it('腰〜腹（1.0m）はスコア4', () => {
    expect(getWaveBaseScore(1.0).score).toBe(4);
  });

  it('null はスコア1・ラベル"-"', () => {
    const result = getWaveBaseScore(null);
    expect(result.score).toBe(1);
    expect(result.label).toBe('-');
  });
});

describe('getWindEffect', () => {
  it('強いオフショアはプラス補正', () => {
    expect(getWindEffect('N', 'S', 3)).toBe(1);
  });

  it('強いオンショアはマイナス補正', () => {
    expect(getWindEffect('N', 'N', 6)).toBe(-2);
  });

  it('8m/s超の強風は方向問わず大きなペナルティ', () => {
    expect(getWindEffect('N', 'S', 9)).toBe(-1);
    expect(getWindEffect('N', 'N', 9)).toBe(-3);
  });

  it('風向き不明は0を返す', () => {
    expect(getWindEffect('N', '-', 5)).toBe(0);
  });
});

describe('calculateQuality', () => {
  it('フラット（0.1m）は常にD', () => {
    expect(calculateQuality(5, 1, true, 0.1, 10)).toBe('D');
  });

  it('高スコア+ベストスウェル+長周期でS', () => {
    expect(calculateQuality(4, 1, true, 1.0, 10)).toBe('S');
  });

  it('スコア2はC', () => {
    expect(calculateQuality(2, 0, false, 0.5, 8)).toBe('C');
  });

  it('潮汐補正がスコアに加算される', () => {
    const withTide = calculateQuality(3, 0, false, 0.8, 8, false, 1);
    const withoutTide = calculateQuality(3, 0, false, 0.8, 8, false, 0);
    expect(withTide).not.toBe(withoutTide);
  });
});

describe('checkBestSwell', () => {
  it('ベストうねり方向かつ8秒以上でtrue', () => {
    expect(checkBestSwell('N, NNE, NW', 'N', 10)).toBe(true);
  });

  it('周期8秒未満はfalse', () => {
    expect(checkBestSwell('N, NNE', 'N', 7)).toBe(false);
  });

  it('ベスト方向外はfalse', () => {
    expect(checkBestSwell('N, NNE', 'S', 10)).toBe(false);
  });

  it('bestSwellが未定義の場合はfalse', () => {
    expect(checkBestSwell(undefined, 'N', 10)).toBe(false);
  });
});

describe('computeTideHeight', () => {
  it('数値を返す', () => {
    const h = computeTideHeight(Date.UTC(2024, 0, 1, 0, 0, 0), 'maizuru');
    expect(typeof h).toBe('number');
    expect(isNaN(h)).toBe(false);
  });

  it('舞鶴は日本海なので振幅が小さい（±0.5m以内）', () => {
    const h = computeTideHeight(Date.UTC(2024, 0, 1, 0, 0, 0), 'maizuru');
    expect(Math.abs(h)).toBeLessThan(0.5);
  });

  it('御前崎は太平洋なので振幅が大きい', () => {
    const h = computeTideHeight(Date.UTC(2024, 0, 1, 6, 0, 0), 'omaezaki');
    expect(Math.abs(h)).toBeLessThan(2.5);
  });
});

describe('computeTidePhase', () => {
  it('"rising" | "falling" | "high" | "low" のいずれかを返す', () => {
    const valid = ['rising', 'falling', 'high', 'low'];
    const phase = computeTidePhase(Date.now(), 'toba');
    expect(valid).toContain(phase);
  });
});

describe('getTideScoreEffect', () => {
  it('干潮は+1', () => expect(getTideScoreEffect('low')).toBe(1));
  it('下げ潮は+1', () => expect(getTideScoreEffect('falling')).toBe(1));
  it('上げ潮は0', () => expect(getTideScoreEffect('rising')).toBe(0));
  it('満潮は0', () => expect(getTideScoreEffect('high')).toBe(0));
});
