import { describe, expect, it } from 'vitest';
import { surfPoints } from '@/lib/surf-points';

describe('surf point calibration', () => {
  it('市後浜はドン深でダンパーになりやすい外洋ビーチとして扱う', () => {
    const ichigohama = surfPoints.find(point => point.id === 'point-20');

    expect(ichigohama?.breakProfile).toEqual({
      bottom: 'deep_sand',
      exposure: 'open_ocean',
      dumperRisk: 'high',
      mellowBias: 'low',
      idealPeriodMin: 8,
      shortPeriodPenalty: 1,
      windWavePenalty: 1,
    });
  });
});
