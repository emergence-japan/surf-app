import { describe, it, expect } from 'vitest';
import { isKnownSpotId } from '@/lib/favorites/spot-ids';
import { surfPoints } from '@/lib/surf-points';

describe('isKnownSpotId', () => {
  it('実在するスポットIDを true と判定する', () => {
    // データの先頭スポットのIDは必ず存在する
    expect(isKnownSpotId(surfPoints[0].id)).toBe(true);
    expect(isKnownSpotId('point-7')).toBe(true); // 磯ノ浦
  });

  it('存在しないIDを false と判定する', () => {
    expect(isKnownSpotId('point-9999')).toBe(false);
    expect(isKnownSpotId('')).toBe(false);
    expect(isKnownSpotId('not-a-point')).toBe(false);
  });
});
