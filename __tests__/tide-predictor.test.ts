import { describe, it, expect } from 'vitest';
import { computeTideHeight, generateHourlyTides, TIDE_STATIONS } from '@/lib/tide-predictor';

const FIXED_TIME = Date.UTC(2024, 5, 15, 6, 0, 0); // 2024-06-15 06:00 UTC

describe('computeTideHeight', () => {
  it('数値を返す', () => {
    const result = computeTideHeight(FIXED_TIME, 'maizuru');
    expect(typeof result).toBe('number');
    expect(isNaN(result)).toBe(false);
  });

  it('合理的な範囲内の値を返す（日本の潮汐: -2m〜2m）', () => {
    Object.keys(TIDE_STATIONS).forEach(station => {
      const result = computeTideHeight(
        FIXED_TIME,
        station as keyof typeof TIDE_STATIONS
      );
      expect(result).toBeGreaterThan(-2.0);
      expect(result).toBeLessThan(2.0);
    });
  });

  it('観測局によって異なる値を返す', () => {
    const maizuru = computeTideHeight(FIXED_TIME, 'maizuru');
    const toba = computeTideHeight(FIXED_TIME, 'toba');
    // 舞鶴（日本海）と鳥羽（太平洋）は潮差が大きく異なる
    expect(maizuru).not.toBe(toba);
  });

  it('時刻が変わると値が変化する（潮汐は動的）', () => {
    const t1 = computeTideHeight(FIXED_TIME, 'muroto');
    const t2 = computeTideHeight(FIXED_TIME + 6 * 3600 * 1000, 'muroto'); // 6時間後
    expect(t1).not.toBe(t2);
  });

  it('cm単位で丸められる（小数点以下2桁）', () => {
    const result = computeTideHeight(FIXED_TIME, 'osaka');
    const decimals = (result.toString().split('.')[1] ?? '').length;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it('全ての観測局で計算が成功する', () => {
    const stations = Object.keys(TIDE_STATIONS) as Array<keyof typeof TIDE_STATIONS>;
    stations.forEach(station => {
      expect(() => computeTideHeight(FIXED_TIME, station)).not.toThrow();
    });
  });

  it('日本海の局（舞鶴）は潮差が小さい', () => {
    // 日本海は半日周潮が弱く潮差が小さい（通常 ±0.5m 以下）
    const results = Array.from({ length: 12 }, (_, i) =>
      computeTideHeight(FIXED_TIME + i * 3600 * 1000, 'maizuru')
    );
    const max = Math.max(...results);
    const min = Math.min(...results);
    expect(max - min).toBeLessThan(0.8); // 日本海の潮差は通常 0.5m 未満
  });

  it('太平洋の局（御前崎）は潮差が大きい', () => {
    // 太平洋側は潮差が大きい（通常 ±1m 以上）
    const results = Array.from({ length: 24 }, (_, i) =>
      computeTideHeight(FIXED_TIME + i * 3600 * 1000, 'omaezaki')
    );
    const max = Math.max(...results);
    const min = Math.min(...results);
    expect(max - min).toBeGreaterThan(0.5);
  });
});

describe('generateHourlyTides', () => {
  it('指定した時間数のデータを返す', () => {
    const result = generateHourlyTides(FIXED_TIME, 24, 'maizuru');
    expect(result).toHaveLength(24);
  });

  it('各エントリは time と height を持つ', () => {
    const result = generateHourlyTides(FIXED_TIME, 3, 'toba');
    result.forEach(entry => {
      expect(typeof entry.time).toBe('string');
      expect(typeof entry.height).toBe('number');
    });
  });

  it('時刻が1時間ずつ増加する', () => {
    const result = generateHourlyTides(FIXED_TIME, 3, 'osaka');
    const t0 = new Date(result[0].time).getTime();
    const t1 = new Date(result[1].time).getTime();
    const t2 = new Date(result[2].time).getTime();
    expect(t1 - t0).toBe(3600 * 1000);
    expect(t2 - t1).toBe(3600 * 1000);
  });

  it('hours=0 の場合は空配列を返す', () => {
    const result = generateHourlyTides(FIXED_TIME, 0, 'muroto');
    expect(result).toHaveLength(0);
  });

  it('ISO 8601 形式の時刻文字列を返す', () => {
    const result = generateHourlyTides(FIXED_TIME, 1, 'komatsushima');
    expect(() => new Date(result[0].time)).not.toThrow();
    expect(new Date(result[0].time).getTime()).not.toBeNaN();
  });
});
