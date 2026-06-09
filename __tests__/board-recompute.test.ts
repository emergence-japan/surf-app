import { describe, it, expect } from 'vitest';
import { applyBoardType } from '@/lib/board-recompute';
import type { SurfPointDetail, DailyForecastData } from '@/lib/types';

function makeDaily(overrides: Partial<DailyForecastData> = {}): DailyForecastData {
  return {
    time: '2026-06-10',
    waveHeight: 2.2,      // 肩〜頭: ショート score 3 / ロング score 2
    rawWaveHeight: 2.4,
    waveLabel: '肩〜頭',
    windSpeedMax: 2,      // 弱風
    windDir: 'N',         // beachFacing 'S' に対してオフショア (+1)
    temperatureMax: null,
    temperatureMin: null,
    weatherCode: 0,
    quality: 'A',         // short 想定の API 計算値
    period: 10,
    isBestSwell: false,
    ...overrides,
  };
}

function makePoint(daily: DailyForecastData[]): SurfPointDetail {
  return {
    id: 'point-test',
    beach: 'テストビーチ',
    height: '肩〜頭',
    heightValue: 2.2,
    heightMeters: 2.2,
    heightRange: '2.0-2.5m',
    rawSwellHeight: 2.4,
    period: 10,
    windSpeed: 2,
    windDirection: 'N',
    temperature: 20,
    quality: 'A',
    waveDirectionStr: 'S',
    waveDirectionDeg: 180,
    isBestSwell: false,
    beachFacing: 'S',
    conditionSummary: '',
    hourly: [],
    daily,
  };
}

describe('applyBoardType: 週間予報（daily）の再計算', () => {
  it('ロング切替で daily の quality がボード特性に応じて変わる', () => {
    const point = makePoint([makeDaily()]);
    // 2.2m・オフショア: ショート 3+1=4 → A、ロング 2+1=3 → B
    const short = applyBoardType(point, 'short');
    const long = applyBoardType(point, 'long');
    expect(short.daily[0].quality).toBe('A');
    expect(long.daily[0].quality).toBe('B');
  });

  it('日ごとの isBestSwell が再計算に使われる（current の値ではない）', () => {
    // current は isBestSwell=false のまま、daily 側だけ true にする
    const point = makePoint([makeDaily({ isBestSwell: true })]);
    const noBest = applyBoardType(makePoint([makeDaily({ isBestSwell: false })]), 'short');
    const withBest = applyBoardType(point, 'short');
    // ベストうねりボーナス +1 で 4 → 5 相当（A → S、キャップは 2.2m なので S 可）
    expect(withBest.daily[0].quality).not.toBe(noBest.daily[0].quality);
  });

  it('period / isBestSwell が無い旧キャッシュでもクラッシュしない', () => {
    const legacy = makeDaily();
    delete legacy.period;
    delete legacy.isBestSwell;
    const point = makePoint([legacy]);
    expect(() => applyBoardType(point, 'long')).not.toThrow();
    const result = applyBoardType(point, 'long');
    expect(['S', 'A', 'B', 'C', 'D']).toContain(result.daily[0].quality);
  });

  it('waveLabel もボード種別の基準で再計算される', () => {
    // 0.6m: ショートは「ヒザ〜腰」(score 3)、ロングも「ヒザ〜腰」(score 5)
    // ラベルは同じだが quality が変わることを確認
    const point = makePoint([makeDaily({ waveHeight: 0.6, waveLabel: 'ヒザ〜腰' })]);
    const short = applyBoardType(point, 'short');
    const long = applyBoardType(point, 'long');
    expect(short.daily[0].waveLabel).toBe('ヒザ〜腰');
    expect(long.daily[0].waveLabel).toBe('ヒザ〜腰');
    // ロングは 0.6m がベストゾーンなので評価が上がる
    expect(long.daily[0].quality).not.toBe(short.daily[0].quality);
  });
});
