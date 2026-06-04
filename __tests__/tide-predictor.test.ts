import { describe, it, expect } from 'vitest';
import {
  computeTideHeight,
  rawTideHeight,
  generateHourlyTides,
  TIDE_STATIONS,
  type TideStationKey,
} from '@/lib/tide-predictor';

const FIXED_TIME = Date.UTC(2024, 5, 15, 6, 0, 0); // 2024-06-15 06:00 UTC

/** 指定日（JST 00:00 始まり）の満潮・干潮を 1 分刻みで抽出する */
function extractExtremes(
  station: TideStationKey,
  jstDateUTC: number
): { type: 'high' | 'low'; minutes: number }[] {
  const samples: number[] = [];
  for (let m = 0; m <= 24 * 60; m++) {
    samples.push(rawTideHeight(jstDateUTC + m * 60000, station));
  }
  const extremes: { type: 'high' | 'low'; minutes: number }[] = [];
  for (let i = 1; i < samples.length - 1; i++) {
    const a = samples[i - 1], b = samples[i], c = samples[i + 1];
    if ((b > a && b >= c) || (b < a && b <= c)) {
      extremes.push({ type: b > a ? 'high' : 'low', minutes: i });
    }
  }
  return extremes;
}

/** "HH:MM" を 0 時からの分に変換 */
const hm = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

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
    // 太平洋側は日本海より潮差が大きい。小潮の日に当たると1日の潮差は小さく
    // なるため、半月分（大潮を含む）の最大潮差で評価する。
    const results = Array.from({ length: 15 * 24 }, (_, i) =>
      computeTideHeight(FIXED_TIME + i * 3600 * 1000, 'omaezaki')
    );
    const max = Math.max(...results);
    const min = Math.min(...results);
    expect(max - min).toBeGreaterThan(0.8); // 大潮時は 1m 超
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

describe('気象庁公式予測との一致（室戸岬 2026-06-02）', () => {
  // 気象庁公式予測: 満潮 06:05 / 19:55, 干潮 00:43 / 13:00（JST）
  // JST 6/2 00:00 = UTC 6/1 15:00
  const JST_2026_06_02 = Date.UTC(2026, 5, 2, -9, 0, 0);
  const TOLERANCE_MIN = 20; // 満干時刻の許容誤差 [分]

  const expected = [
    { type: 'low' as const, time: '00:43' },
    { type: 'high' as const, time: '06:05' },
    { type: 'low' as const, time: '13:00' },
    { type: 'high' as const, time: '19:55' },
  ];

  const extremes = extractExtremes('muroto', JST_2026_06_02);

  it('満潮・干潮がちょうど4回検出される', () => {
    expect(extremes).toHaveLength(4);
  });

  expected.forEach((exp, idx) => {
    it(`${idx + 1}番目: ${exp.type === 'high' ? '満潮' : '干潮'} ${exp.time} ±${TOLERANCE_MIN}分`, () => {
      const actual = extremes[idx];
      expect(actual.type).toBe(exp.type);
      expect(Math.abs(actual.minutes - hm(exp.time))).toBeLessThanOrEqual(TOLERANCE_MIN);
    });
  });
});
